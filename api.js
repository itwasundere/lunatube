var models = require('./models.js');
var utils = require('./sutils');
var logger = require('./logger.js');
var Backbone = require('backbone');
var cookiep = require('cookie');

var SocketWrapper = Backbone.Model.extend({
	initialize: function() {
		if (!this.get('room') || 
			!this.get('user') ||
			!this.get('sock')) return;
		//control flooding
		this.get('sock').timed_on = function(event, fn){
			var self = this;
			this.on(event, function(data){
				if (self.timer) return;
				else {
					self.timer = true;
					setTimeout(function(){self.timer=false},300);
					fn(data);
				}
			});
		};
		this.bind_sock_events();
		this.bind_room_events();
		this.send_messages();
	},
	send_messages: function(){
		var msgs = this.get('room').get('messages').last(20);
		var sock = this.get('sock');
		for(idx in msgs){
			var msg = msgs[idx];
			this.get('sock').emit('message', msg.toJSON());
		}
	},
	bind_sock_events: function() {
		var self = this;
		var room = this.get('room');
		var user = this.get('user');
		var sock = this.get('sock');
		var queue = room.get('queue');
		var playlist = room.get('playlist');
		var player = room.get('player');
		
		// todo -- cached users may have changed, don't use references

		sock.on('disconnect', function(){
			self.disconnected = true;
			room.leave(self.get('user'));
		});
		sock.timed_on('message', function(content){
			if (!content || !typeof(content)=='string') return;
			content = utils.purge(content, 512);
			room.message(self.get('user'), content);
		});
		sock.on('player_prompt', function(){
			sock.emit('player', player.toJSON());
		});
		sock.on('player_action', function(data){
			if (!data || (!data.time && !data.state)) return;
			var username = self.get('user').get('username');
			var time = parseInt(data.time);
			if (time <= player.get('current').get('time') && time >= 0) {
				if (Math.abs(time-player.get('time')) >= 2)
					room.trigger('status', username+' seeked to '+time+' seconds');
				player.seek(time);
			}
			var state = data.state;
			if (state == 'playing' || state == 'paused')
				if (state != player.get('state')) {
					player.set('state', state);
					room.trigger('status', username+' set video to '+state);
				}
		});
		sock.on('add_queue', function(video){
			if (!video) return;
			queue.append(video);
			var username = self.get('user').get('username');
			room.trigger('status', username+' added a video to queue');
		});
		sock.on('add_playlist', function(video){
			if (!video) return;
			playlist.append(video);
			var username = self.get('user').get('username');
			room.trigger('status', username+' added a video to playlist');
		});
		sock.on('remove_video', function(video){
			if (!video) return;
			var v = playlist.get(video.id);
			var b = queue.get(video.id)
			if (v) {
				playlist.kill(v);
				var username = self.get('user').get('username');
				room.trigger('status', username+' removed a video from playlist');
			}
			if (b) {
				queue.remove(b);
				var username = self.get('user').get('username');
				room.trigger('status', username+' removed a video to queue');
			}
		});
		sock.on('mod', function(uid){
			if (!uid) return;
			if (!room.get('userlist').get(uid)) return;
			// todo -- can't mod guests
			var modlink = room.get('modlist').where({user_id: uid});
			if (modlink.length) {
				modlink = modlink[0];
				modlink.destroy();
				room.get('modlist').remove(modlink);
			}
			else {
				var modlink = new Backbone.Model({user_id: uid, room_id: room.id});
				modlink.classname = 'mod';
				modlink.save();
				room.get('modlist').add(modlink);
			}
		});
		sock.on('mute', function(uid){
			if (!uid) return;
			var user = room.get('userlist').get(uid);
			if (!user) return;
			var muted = room.get('mutelist').get(uid);
			if (muted) {
				room.get('mutelist').remove(muted);
			} else {
				room.get('mutelist').add(user);
			}
		});
		sock.on('clear', function(list){
			if (list == 'playlist') {
				room.get('playlist').each(function(video){
					video.destroy();
				});
				room.get('playlist').reset();
			}
			else if (list == 'queue') room.get('queue').reset();
		});
		sock.on('play_video', function(video){
			if (!video) return;
			var id = video.id;
			if (queue.get(id)) {
				player.set_vid(queue.get(id));
			} else if (playlist.get(id)) {
				player.set_vid(playlist.get(id));
			} else {
				var curr = player.get('current');
				queue.insert(video, curr);
				player.trigger('end');
			}
			var username = self.get('user').get('username');
			room.trigger('status', username+' played a new video');
		});
		sock.timed_on('logout', function(){
			self.login(new models.User());
		});
		sock.timed_on('login', function(login){
			login.username = utils.purge(login.username, 32);
			login.password = utils.purge(login.password, 32);
			if (!login || !login.username || !login.password) return;

			var user = new models.User({
				blank: { username: login.username }
			});
			user.fetch({success:function(){
				if (user.id) {
					var user2 = new models.User({ blank: {
						username: login.username,
						password: login.password
					}});
					user2.fetch({success:function(){
						if (user2.id)
							self.login(user2);
						else
							sock.emit('login', false);
					}})
				} else {
					user = new models.User({ blank: {
						username: login.username,
						password: login.password,
						avatar_url: '/static/avatars/newfoal.png'
					}});
					user.save({},{success:function(){
						self.login(user);
					}});
				}
			}})
		});
	},
	login: function(new_user) {
		var old_user = this.get('user');
		this.get('room').leave(old_user);
		this.get('room').join(new_user);
		this.set('user', new_user);
		this.get('sock').emit('login', new_user.toJSON());
		this.trigger('login', this.get('sid'), old_user, new_user);
	},
	bind_room_events: function() {
		var self = this;
		var room = this.get('room');
		var user = this.get('user');
		var sock = this.get('sock');
		
		var userlist = room.get('userlist');
		userlist.bind('add remove', function(){
			if (self.disconnected) return;
			sock.emit('userlist', userlist.toJSON()); });
		userlist.bind('add', function(user){
			sock.emit('status', user.get('username')+' has joined'); });
		userlist.bind('remove', function(user){
			sock.emit('status', user.get('username')+' has left'); });
		room.bind('status', function(msg){
			sock.emit('status', msg);
		});

		room.get('messages').bind('add', function(message){
			if (self.disconnected) return;
			sock.emit('message', message.toJSON()); });
		
		room.get('player').bind('change', function(){
			if (self.disconnected) return;
			sock.emit('player', room.get('player').toJSON()); });

		room.get('modlist').bind('add remove reset', function(){
			sock.emit('modlist', room.get('modlist').toJSON()); });

		room.get('mutelist').bind('add remove reset', function(){
			sock.emit('mutelist', room.get('mutelist').toJSON()); });

		var queue = room.get('queue');
		queue.on('add remove', function(){
			if (self.disconnected) return;
			sock.emit('queue', queue.toJSON());
		});
		
		var playlist = room.get('playlist');
		playlist.on('add remove reset', function(){
			if (self.disconnected) return;
			sock.emit('playlist', playlist.toJSON());
		});

	}
});

var SocketList = Backbone.Collection.extend({
	model: SocketWrapper
});

var ConnectionApi = Backbone.Model.extend({
	defaults: { connections: new SocketList() },
	initialize: function() {
		var self = this;
		this.get('io').sockets.on('connection', 
			function(sock){ self.connect(sock); });
		this.get('connections').bind('login', function(sid, old_user, new_user){
			self.get('userlist').remove(old_user);
			self.get('userlist').add(new_user);
			self.get('sessions').set(sid,{user_id: new_user.id})
		});
	},
	connect: function(sock) {
		console.log('connection from '+sock.handshake.address.address);

		var self = this;
		var sessions = this.get('sessions');
		var user = new models.User();
		var users = this.get('userlist');
		var cookie = sock.handshake.headers.cookie;
		var session = {user_id: user.id}
		var sid = utils.hash();

		var new_user = function() {
			/*
			var md5 = utils.hash();
			sessions.set(md5, session);
			// sock.handshake.headers.cookie = utils.cookie({session: md5}, 14);
			users.add(user);
			*/
			sock.disconnect();
		}

		if (!cookie) new_user();
		else {
			var csid = cookiep.parse(cookie).session;
			if (!csid) new_user();
			else {
				var csession = sessions.get(csid);
				if (!csession) new_user();
				else {
					sid = csid;
					session = csession;
					user = users.get(session.user_id);
				}
			} 
		}

		sock.on('join', function(room_id){
			var room = self.get('roomlist').get(room_id);
			if (!room) return;
			var wrap = new SocketWrapper({
				sock: sock,
				user: user,
				room: room,
				sid: sid
			});
			self.get('connections').add(wrap);
			room.join(user);
		});
	},
});

module.exports = { ConnectionApi: ConnectionApi };
