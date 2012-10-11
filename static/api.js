var ConnectionApi = Backbone.Model.extend({
	initialize: function() {
		var socket = io.connect(this.get('ip'));
		this.set('socket', socket);
		this.bind_events();
	},
	bind_events: function() {
		var sock = this.get('socket');
		var room = this.get('room');
		sock.on('connect', function(data){
			console.log('connected');
			sock.emit('chat',{
				action: 'join'
			});
		});
		sock.on('chat', function(data){
			console.log('received '+JSON.stringify(data));
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
			console.log('sending '+JSON.stringify(unsent));
			sock.emit('chat', {
				action: 'message',
				message: unsent
			});
		});
	}
});