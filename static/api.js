var ConnectionApi = Backbone.Model.extend({
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
						var existing = messages.where({hash: msg.hash});
						if (!existing) room.get('messages').add(msg);
						else existing[0].set(msg);
					}
				default: break;
			}
		});

		// sending messages
		var messages = room.get('messages');
		messages.bind('add', function(){
			var unsent = messages.filter(function(msg){
				return msg.get('sent') == false; });
			for (idx in unsent) {
				var message = unsent[idx];
				message.set('sent', true);
				// todo -- change this to user
				var hash = md5(''+now());
				message.set('hash', hash);
				unsent[idx] = message.toJSON()
			}
			sock.emit('chat', {
				action: 'message',
				message: unsent
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
		}, 1000);
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