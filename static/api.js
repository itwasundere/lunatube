var ConnectionApi = Backbone.Model.extend({
	defaults: {
		refresh: 2000
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
		room.on('play play_new', function(video){
			sock.emit('play_video', video.toJSON());
		});
		room.on('delete', function(video){
			sock.emit('remove_video', video.toJSON());
		});
		room.on('queue', function(video){
			sock.emit('add_queue', video.toJSON())
		});
		room.on('playlist', function(video){
			sock.emit('add_playlist', video.toJSON());
		});
		user.on('login', function(){
			sock.emit('login', user.toJSON());
		});
		user.on('logout', function(){
			sock.emit('logout');
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
			if (player.get('current').id != data.current.id)
				player.set('current', new models.Video(data.current));
		});
		sock.on('status', function(msg){
			room.trigger('status',msg);
		});
		sock.on('userlist', function(userlist){
			room.get('userlist').reset(userlist);
		});
		sock.on('message', function(message){
			room.get('messages').add(message);
			if (document.hasFocus() && !window.blurred) return;
			if (!window.msgcount) window.msgcount=0;
			window.msgcount++;
			document.title = '('+window.msgcount+') Lunatube';
		});
		sock.on('playlist', function(pl){
			room.get('playlist').reset(pl);
		});
		sock.on('queue', function(q){
			room.get('queue').reset(q);
		});
		sock.on('login', function(user_info){
			if (!user_info) alert('bad password');
			user.set(user_info);
		});
	}
});

window.onblur = function(){
	window.blurred = true;
}
window.addEventListener('focus', function() {
	window.blurred = false;
	document.title='Lunatube';
	window.msgcount=0;
});