var models = require('./models.js');
var utils = require('./sutils');
var Backbone = require('backbone');
var Underscore = require('underscore');

var SocketWrapper = Backbone.Model.extend({
	initialize: function() {
		if (!this.get('room') || 
			!this.get('user') ||
			!this.get('sock')) return;
		console.log('user '+this.get('user').id+' joined room'+this.get('room').id);
		this.bind_sock_events();
		this.bind_room_events();
		this.get('sock').emit('userlist', 
			this.get('room').get('userlist').toJSON());
	},
	bind_sock_events: function() {
		var self = this;
		var room = this.get('room');
		var user = this.get('user');
		var sock = this.get('sock');
		
		// todo -- making sure room isn't null
		// set current video
		// wanting to join --> goes to connection api
		sock.on('disconnect', function(){
			self.disconnected = true;
			console.log('user '+user.id+' disconnected');
			room.leave(user);
		});
		sock.on('message', function(content){
			if (!content || !typeof(content)=='string') return;
			console.log('incoming '+user.id+' message '+content);
			var message = new models.Message({
				author: user.id,
				content: content,
				time: (new Date()).getTime()
			});
			room.message(user, message);
		});
		sock.on('player_prompt', function(){
			console.log('outputting player state to '+user.id);
			sock.emit('player', room.get('player').toJSON());
		});
		sock.on('player_action', function(data){
			console.log('player action by '+user.id);
			console.log(data);
			var player = room.get('player');
			if (!data) return;
			var time = parseInt(data.time);
			if (time && time <= player.get('current').get('time'))
				player.seek(time);
			if (data.state == 'playing' || data.state == 'paused')
				if (data.state != player.get('state'))
					player.set('state', data.state)
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
			console.log('outputting userlist '+userlist.length);
			sock.emit('userlist', userlist.toJSON()); });

		// outgoing messages
		room.get('messages').bind('add', function(message){
			if (self.disconnected) return;
			console.log('outputting message '+message.id);
			sock.emit('message', message.toJSON()); });
		
		// on vid switch
		room.bind('change:current', function(){
			if (self.disconnected) return;
			sock.emit('current', room.get('current').toJSON()); });

		// playback changes
		room.get('player').bind('change', function(){
			if (self.disconnected) return;
			sock.emit('player', room.get('player').toJSON()); });
	}
});

var SocketList = Backbone.Collection.extend({
	model: SocketWrapper
});

var ConnectionApi = Backbone.Model.extend({
	defaults: { 
		connections: new SocketList()
	},
	initialize: function() {
		if (!this.get('io') || !this.get('store')) return;
		var self = this;
		this.get('io').sockets.on('connection', 
			function(sock){ self.connect(sock); });
	},
	connect: function(sock) {
		console.log('connection from '+sock.handshake.address.address);
		var self = this;
		var cookie = sock.handshake.headers.cookie || '';
		utils.get_session(this.get('store'), cookie, function(session){
			var user;
			if (session)
				user = self.get('userlist').get(session.user_id);
			if (!user) {
				user = new models.User();
				self.get('userlist').add(user);
			}
			sock.on('join', function(room_id){
				if (!room_id) return;
				var room = self.get('roomlist').get(room_id);
				if (!room) return;
				room.join(user);
				self.get('connections').add(new SocketWrapper({
					room: room, user: user, sock: sock
				}));
			});
		});
	},
});

module.exports = { ConnectionApi: ConnectionApi };
