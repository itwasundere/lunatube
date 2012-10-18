var ConnectionApi = Backbone.Model.extend({
	defaults: {
		refresh: 1000
	},
	initialize: function() {
		var sock = io.connect(this.get('ip'));
		this.set('sock', sock);
		sock.on('connect', function(data){
			console.log('connected');
			sock.emit('join', window.room.id);
		});
		this.start_player_loop();
		this.bind_room_events();
		this.bind_sock_events();
	},
	start_player_loop: function() {
		var sock = this.get('sock');
		setInterval(function(){ 
			sock.emit('player_prompt');
		}, this.get('refresh'));
	},
	bind_room_events: function() {
		var self = this;
		var room = this.get('room');
		var user = this.get('user');
		var sock = this.get('sock');
		room.bind('message', function(content){
			sock.emit('message', content);
			console.log('outputting message '+content);
		});
		var player = room.get('player');
		player.bind('action', function(){
			sock.emit('player_action', player.toJSON());
			console.log('outputting player state');
		});
	},
	bind_sock_events: function() {
		var self = this;
		var room = this.get('room');
		var user = this.get('user');
		var sock = this.get('sock');
		// todo -- on current
		sock.on('player', function(data){
			var player = room.get('player');
			player.set({
				state: data.state,
				time: data.time
			});
			if (player.get('current').get('url') != data.current.url)
				player.set('current', new models.Video(data.current));
		});
		sock.on('userlist', function(userlist){
			room.get('userlist').reset(userlist);
		});
		sock.on('message', function(message){
			room.get('messages').add(message);
		});
	}
});