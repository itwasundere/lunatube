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
		this.bind_sock_events();
		this.bind_room_events();
	},
	bind_sock_events: function() {
		var self = this;
		var room = this.get('room');
		var user = this.get('user');
		var sock = this.get('sock');
		var queue = room.get('queue');
		var playlist = room.get('playlist');
		var player = room.get('player');
			
		sock.on('disconnect', function(){
			self.disconnected = true;
			room.leave(user);
		});
		sock.on('message', function(content){
			if (!content || !typeof(content)=='string') return;
			room.message(user, content);
		});
		sock.on('player_prompt', function(){
			sock.emit('player', player.toJSON());
		});
		sock.on('player_action', function(data){
			if (!data || (!data.time && !data.state)) return;
			var time = parseInt(data.time);
			if (time <= player.get('current').get('time') && time >= 0)
				player.seek(time);
			var state = data.state;
			if (state == 'playing' || state == 'paused')
				if (state != player.get('state'))
					player.set('state', state);
		});
		sock.on('add_queue', function(video){
			if (!video) return;
			queue.append(video);
		});
		sock.on('add_playlist', function(video){
			if (!video) return;
			playlist.append(video);
		});
		sock.on('remove_video', function(video){
			if (!video) return;
			var v = playlist.get(video.id);
			var b = queue.get(video.id)
			if (v) playlist.kill(v);
			if (b) queue.remove(b);
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
		});
		sock.on('logout', function(){
			self.trigger('login', self.get('user'), (new models.User()));
		});
		sock.on('login', function(login){
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
							self.trigger('login', self.get('user'), user2);
						else
							console.log('password failed');
					}})
				} else {
					user = new models.User({ blank: {
						username: login.username,
						password: login.password,
						avatar_url: '/static/avatars/newfoal.png'
					}});
					user.save({},{success:function(){
						self.trigger('login', self.get('user'), user);
					}});
				}
			}})
		});
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

		room.get('messages').bind('add', function(message){
			if (self.disconnected) return;
			sock.emit('message', message.toJSON()); });
		
		room.get('player').bind('change', function(){
			if (self.disconnected) return;
			sock.emit('player', room.get('player').toJSON()); });

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
	},
	connect: function(sock) {
		console.log('connection from '+sock.handshake.address.address);

		var self = this;
		var sessions = this.get('sessions');
		var user = new models.User();
		var users = this.get('userlist');
		var cookie = sock.handshake.headers.cookie;
		var session = {user_id: user.id}
		
		var new_user = function() {
			var md5 = utils.hash();
			sessions.set(md5, session);
			// sock.handshake.headers.cookie = utils.cookie({session: md5}, 14);
			users.add(user);
		}

		if (!cookie) new_user();
		else {
			var sid = cookiep.parse(cookie).session;
			if (!sid) new_user();
			else {
				var csession = sessions.get(sid);
				if (!csession) new_user();
				else {
					session = csession;
					user = users.get(session.user_id);
				}
			} 
		}

		var wrap;
		var room;
		sock.on('join', function(room_id){
			room = self.get('roomlist').get(room_id);
			if (!room) return;
			wrap = new SocketWrapper({
				sock: sock,
				user: user,
				room: room
			});
			self.get('connections').add(wrap);
			room.join(user);
		});

		this.get('connections').bind('login', function(old_user, new_user){
			room.leave(old_user);
			room.join(new_user);
			users.remove(old_user);
			users.add(new_user);
			wrap.set('user', new_user);
			sock.emit('login', new_user.toJSON());
			sessions.set(sid,{user_id: new_user.id})
		})
	},
});

module.exports = { ConnectionApi: ConnectionApi };
