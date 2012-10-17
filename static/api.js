var ConnectionApi = Backbone.Model.extend({
	defaults: {
		refresh: 1000
	},
	initialize: function() {
		var sock = io.connect(this.get('ip'));
		this.set('socket', sock);
		sock.on('connect', function(data){
			console.log('connected');
			sock.emit('chat',{
				action: 'join'
			});
		});
		this.init_room();
		this.init_messages();
		this.init_player();
	},
	init_room: function() {
		var sock = this.get('socket');
		var room = this.get('room')
		room.bind('action', function(){
			sock.emit('room', {
				action: 'state',
				room: {
					current: room.get('current').toJSON()
				}
			});
		});
		sock.on('room', function(data){
			room.set({ current: new models.Video(data.current) });
		});
	},
	init_messages: function() {
		var sock = this.get('socket');
		var room = this.get('room');
		room.bind('message', function(data){
			if (!data || !data.msg) return;
			sock.emit('message', data.msg.toJSON());
		});

		// receiving messages
		sock.on('chat', function(data){
			switch(data.action) {
				case 'userlist': 
					room.get('userlist').reset(data.userlist); 
					break;
				case 'message':
					var messages = room.get('messages');
					for (idx in data.messages) {
						var msg = data.messages[idx];
						room.get('messages').add(msg);
					}
				default: break;
			}
		});

		// sending messages
		room.bind('message', function(data){
			var msg = data.msg;
			sock.emit('chat', {
				action: 'message',
				message: data.msg
			});
		});
	},
	init_player: function() {
		var self = this;
		var sock = this.get('socket');
		var room = this.get('room');
		var player = this.get('room').get('player');
		setInterval(function(){ 
			sock.emit('player', { action: 'state' });
		}, this.get('refresh'));
		sock.on('player', function(data){
			player.set({
				state: data.state,
				time: data.time,
				current: new models.Video(data.current)
			});
		});
		player.on('action', function(){
			// todo -- re-enable security
			// if (!room.get('modlist').get(window.user.id)) return;
			sock.emit('player', {
				action: 'update',
				player: player.toJSON()
			});
		});
	}
});