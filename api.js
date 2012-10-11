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
				user: session.user,
				room: self.get('roomlist').get(session.room_id)
			});
			self.get('io').emit('connected', {params: true});
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
		sock.on('disconnect', function(){});
		sock.on('chat', function(data){ self.chat(data) });
		sock.on('playback', function(data){ self.playback(data) });
		sock.on('playlist', function(data){ self.playlist(data) });
		room.get('userlist').bind('add remove', function(){
			sock.emit('chat', room.toJSON());
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

/*
io.sockets.on('connection', function(socket){
	console.log('conn from '+socket.handshake.address.address);
	get_session(socket.handshake.headers.cookie, function(session){
		if (!session) {
			// todo -- reconnect to client after server crash
			socket.disconnect();
			return;
		}
		socket.user = userlist.get(session.user_id);
		socket.room = roomlist.get(session.room_id);
		socket.emit('connected');
	}, session_store);
	socket.on('disconnect', function(){
		if (socket.room && socket.user)
			socket.room.leave(socket.user);
			// trigger event to emit userlist
		/*
		socket.leave(socket.room.id);
		var userlist = io.sockets.clients(socket.room.id);
		for(key in userlist)
			userlist[key] = userlist[key].user;
		io.sockets.in(socket.room.id).emit('left',socket.user);
		io.sockets.in(socket.room.id).emit('members',userlist);
		
	});
	/*
	socket.on('join', function(){
		console.log('join');
		socket.join(socket.room.id);
		var userlist = io.sockets.clients(socket.room.id);
		for(key in userlist)
			userlist[key] = userlist[key].user;
		io.sockets.in(socket.room.id).emit('joined',socket.user);
		io.sockets.in(socket.room.id).emit('members',userlist);
	});
	socket.on('message', function(message){
		message.user_id = socket.user.id;
		io.sockets.in(socket.room.id).emit('message', message);
	});
	
	socket.on('chat', function(data){
		if (!data || !data.action) return;
		var room = rooms[socket.room.id];
		switch(data.action) {
			case 'join': room.join(data.param); break;
			case 'message': room.message(data.param); break;
			case 'mute': room.mute(data.param); break;
			case 'mod': room.mod(data.param); break;
			default: break;
		}
	});
	socket.on('playback', function(data) {
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
	});
	socket.on('playlist', function(data){
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
	});
	socket.on('playlist', function(data){
		if (!data || !data.action) return;
		var room = rooms[socket.room.id];
		var playlist = room.playlist;
		switch(data.action) {
			case 'append': playlist.append(data.param); break;
			case 'insert': playlist.insert(data.param); break;
			case 'delete': playlist.delete(data.param); break;
			case 'move': playlist.move(data.param); break;
			default: break;
		}
	});
});

}
*/