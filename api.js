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
			console.log('state->'+user.id+' '+room.get('player').get('time')+' '+room.get('player').get('current').get('url')+' '+room.get('player').get('current').get('time'));
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

		var pl = room.get('playlist');
		var queue = room.get('queue');
		var player = room.get('player');
		var playlist = room.get('playlist');
		queue.on('add remove', function(){
			sock.emit('queue', queue.toJSON());
		});
		playlist.on('add remove', function(){
			sock.emit('playlist', playlist.toJSON());
		});
		sock.on('add_queue', function(video){
			if (!video) return;
			video = new models.Video({
				prev: 0, next: 0, queue_id: 0, hash: true,
				url: video.url, time: video.time
			});
			if (!video.verify()) return;
			queue.add(video);
			sock.emit('queue', queue.toJSON());
		});
		sock.on('add_playlist', function(video){
			if (!video) return;
			var prev = pl.last();
			var previd = 0;
			if (prev) previd = prev.id;
			video = new models.Video({
				prev: previd, next: 0, queue_id: pl.id,
				url: video.url, time: video.time
			});
			if (!video.verify()) return;
			video.save({},{success: function(){
				if (prev)
				prev.save({ next: video.id },{success: function(){
					pl.fetch({success: function(){
						sock.emit('playlist', pl.toJSON());
					}});
				}});
			}});
		});
		sock.on('save_queue', function(){
			var queue = new models.Queue({
				owner_id: user.id });
			queue.save({success: function(){
				for(var a=0; a<queue.length; a++) {
					var prev = queue.at(a-1) || {};
					var curr = queue.at(a);
					var next = queue.at(a+1) || {};
					curr.set({ 
						prev: prev.id, 
						next: next.id,
						queue_id: queue.id
					});
					delete curr.id;
					delete curr.attributes.id;
					curr.save();
				}
			}});
		});
		sock.on('play_video', function(video){
			if (!video) return;
			var id = video.id;
			if (queue.get(id)) {
				player.set_vid(queue.get(id));
			} else if (pl.get(id)) {
				player.set_vid(pl.get(id));
			} else {
				video = new models.Video({
					prev: 0, next: 0, queue_id: 0, hash: true,
					url: video.url, time: video.time
				});
				if (!video.verify()) return;
				var pos = queue.indexOf(queue.get(player.get('current').id));
				queue.add(video, {at: pos});
				sock.emit('queue', queue.toJSON());
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
			console.log('outputting userlist '+userlist.length);
			sock.emit('userlist', userlist.toJSON()); });

		// outgoing messages
		room.get('messages').bind('add', function(message){
			if (self.disconnected) return;
			console.log('outputting message '+message.id);
			sock.emit('message', message.toJSON()); });
		
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
		if (!cookie) {
			var user = new models.User();
			self.get('userlist').add(user);
			sock.on('join', function(room_id){
				if (!room_id) return;
				var room = self.get('roomlist').get(room_id);
				if (!room) return;
				room.join(user);
				self.get('connections').add(new SocketWrapper({
					room: room, user: user, sock: sock
				}));
			});
			return;
		}
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
