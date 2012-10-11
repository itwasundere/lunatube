var models = require('./models.js');
var utils = require('./sutils');
var Backbone = require('backbone');

var ConnectionApi = Backbone.Model.extend({
	initialize: function() {
		if (!this.get('io') || !this.get('store')) return;
		var self = this;
		this.get('io').sockets.on('connection', 
			function(socket){ self.connect(socket); });
	},
	connect: function(socket) {
		var self = this;
		var cookie = socket.handshake.headers.cookie;
		utils.get_session(this.get('store'), cookie, function(session){
			if (!session) {
				socket.disconnect();
				return;
			}
			self.set({
				user: new models.User(session.user),
				room: self.get('roomlist').get(session.room_id)
			});
			self.set('socket', socket);
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
			var user_left = userlist.where({hash: user.get('hash')});
			room.leave(user_left);
		});
		sock.on('chat', function(data){ self.chat(data) });
		sock.on('playback', function(data){ self.playback(data) });
		sock.on('playlist', function(data){ self.playlist(data) });

		var userlist = room.get('userlist');
		userlist.bind('add remove', function(){
			sock.emit('chat', {
				action: 'userlist',
				userlist: userlist.toJSON()
			});
		});

		var messages = room.get('messages');
		messages.bind('add', function(){
			var unrelayed = messages.filter(function(msg){
				return msg.get('relayed') == false; });
			for (idx in unrelayed) {
				var msg = unrelayed[idx];
				msg.set('relayed', true);
				unrelayed[idx] = msg.toJSON()
			}
			sock.emit('chat', {
				action: 'message',
				messages: unrelayed
			});
		});
	},
	chat: function(data) {
		if (!data || !data.action) return;
		var room = this.get('room');
		var user = this.get('user');
		switch(data.action) {
			case 'join': 
				room.join(user); 
				break;
			case 'message': 
				room.message(user, data.message); 
				break;
			/*
			case 'mute': 
				var target = new User({id: data.target});
				room.mute(user, target, true);
				break;
			case 'unmute': 
				var target = new User({id: data.target});
				room.mute(user, target, false);
				break;
			case 'mod': 
				var target = new User({id: data.target});
				room.mod(user, target, true);
				break;
			case 'unmod': 
				var target = new User({id: data.target});
				room.unmod(user, target, true);
				break;
			*/
			default: break;
		}
	},
	playback: function(data) {
		if (!data || !data.action) return;
		var room = rooms[socket.room.id];
		switch(data.action) {
			case 'play': room.play(); break;
			case 'pause': room.pause(); break;
			case 'seek': room.seek(data.param); break;
			case 'next': room.next(); break;
			case 'prev': room.prev(); break;
			case 'switch': room.switch(param); break;
			case 'skip': room.skip(data.param); break;
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
