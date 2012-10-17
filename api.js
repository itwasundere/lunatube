var models = require('./models.js');
var utils = require('./sutils');
var Backbone = require('backbone');
var Underscore = require('underscore');

var crypto = require('crypto');

var ConnectionApi = Backbone.Model.extend({
	initialize: function() {
		if (!this.get('io') || !this.get('store')) return;
		var self = this;
		this.get('io').sockets.on('connection', 
			function(socket){ self.connect(socket); });
	},
	connect: function(socket) {
		console.log('connection from '+socket.handshake.address.address);
		var self = this;
		var cookie = socket.handshake.headers.cookie || '';
		utils.get_session(this.get('store'), cookie, function(session){
			if (!session) {
				socket.disconnect();
				return;
			}
			console.log('cookie found, user '+session.user.hash);
			self.set({
				user: new models.User({
					id: session.user.hash,
					username: session.user.username
				}),
				room: self.get('roomlist').get(session.room_id)
			});
			self.set('socket', socket);
			// todo -- only bind once, unbind on disconnect
			self.bind_events();
		});
	},
	bind_events: function() {
		var self = this;
		var sock = self.get('socket');
		var io = this.get('io');
		var room = this.get('room');
		var user = this.get('user');
		var userlist = this.get('room').get('userlist');
		sock.on('disconnect', function(){
			var user_left = userlist.get(user.id);
			room.leave(user_left);
		});
		sock.on('room', function(data){ self.room(data) });
		sock.on('chat', function(data){ self.chat(data) });
		sock.on('player', function(data){ self.player(data) });
		sock.on('playlist', function(data){ self.playlist(data) });

		var userlist = room.get('userlist');
		userlist.bind('add remove', function(){
			sock.emit('chat', {
				action: 'userlist',
				userlist: userlist.toJSON()
			});
		});

		// outgoing messages
		var messages = room.get('messages');
		messages.bind('add', function(){
			var unrelayed = messages.where({relayed: false});
			for (idx in unrelayed) {
				var msg = unrelayed[idx];
				unrelayed[idx] = msg.toJSON()
			}
			sock.emit('chat', {
				action: 'message',
				messages: unrelayed
			});
		});
		
		room.bind('change:current', function(){
			sock.emit('room', {
				current: room.get('current').toJSON() 
			});
		});

	},
	room: function(data) {
		// check mod and security
		if (!data || !data.action) return;
		var room = this.get('room');
		var user = this.get('user');
		switch(data.action) {
			case 'state': 
				room.set({ current: new models.Video(data.room.current) });
				break;
			default: break;
		}
	},
	chat: function(data) {
		if (!data || !data.action) return;
		var room = this.get('room');
		var user = this.get('user');

		console.log('chat action from user '+user.id);
		console.log(data);
		
		switch(data.action) {
			case 'join': 
				room.join(user); 
				break;
			case 'message':
				var md5 = crypto.createHash('md5');
				md5.update(''+(new Date).getTime());
				data.message.id = md5.digest('hex');
				room.message(user, data.message);
				break;
			default: break;
		}
	},
	player: function(data) {
		if (!data || !data.action) return;
		var player = this.get('room').get('player');
		var sock = this.get('socket');
		switch(data.action) {
			case 'state': sock.emit('player', player.toJSON()); break;
			case 'update':
				// todo -- check mod permissions
				player.set({
					state: data.player.state,
					current: new models.Video(data.player.current),
					time: data.player.time
				});
				break;
			default: break;
		}
	},
	playlist: function(data) {
		if (!data || !data.action) return;
		var room = rooms[socket.room.id];
		var queue = room.queue;
		switch(data.action) {
			case 'append': queue.append(data.param); break;
			case 'insert': queue.insert(data.param); break;
			case 'delete': queue.delete(data.param); break;
			case 'move': queue.move(data.param); break;
			case 'save': queue.save(data.param); break;
			default: break;
		}
	}
});

module.exports = { ConnectionApi: ConnectionApi };
