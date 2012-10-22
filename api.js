var models = require('./models.js');
var utils = require('./sutils');
var logger = require('./logger.js');
var Backbone = require('backbone');

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
	},

	bind_room_events: function() {
		var self = this;
		var room = this.get('room');
		var user = this.get('user');
		var sock = this.get('sock');
		
		// outgoing room userlist
		var userlist = room.get('userlist');
		userlist.bind('add remove', function(){
			if (self.disconnected) return;
			sock.emit('userlist', userlist.toJSON()); });

		// outgoing messages
		room.get('messages').bind('add', function(message){
			if (self.disconnected) return;
			sock.emit('message', message.toJSON()); });
		
		// playback changes
		room.get('player').bind('change', function(){
			if (self.disconnected) return;
			sock.emit('player', room.get('player').toJSON()); });

		var queue = room.get('queue');
		queue.on('add remove', function(){
			if (self.disconnected) return;
			sock.emit('queue', queue.toJSON());
		});
		
		var playlist = room.get('playlist');
		playlist.on('add remove', function(){
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
		var users = this.get('userlist');

		var wrapper = { sock: sock };
		var set_user_room = function(params) {
			if (params.user)
				wrapper.user = params.user;
			if (params.room)
				wrapper.room = params.room;
			if (wrapper.user && wrapper.room && wrapper.sock) {
				var wrap = new SocketWrapper(wrapper);
				self.get('connections').add(wrap);
				wrapper.room.join(wrapper.user);
			}
		}
		var new_user = function() {
			var user = new models.User();
			self.get('userlist').add(user);
			return user;
		}

		var cookie = sock.handshake.headers.cookie;

		if (!cookie) {
			set_user_room({user: new_user()});
		} else {
			utils.get_session(this.get('store'), cookie, function(session){
				var user;
				if (session && session.user_id)
					user = users.get(session.user_id);
				else user = new_user();
				set_user_room({user: user});
			});
		}

		sock.on('join', function(room_id){
			var room = self.get('roomlist').get(room_id);
			set_user_room({room: room});
		});
	},
});

module.exports = { ConnectionApi: ConnectionApi };
