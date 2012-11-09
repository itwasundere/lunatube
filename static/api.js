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
		window.mod = ismod(window.user);
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
			if (!mod) return;
			sock.emit('player_action', player.toJSON());
			console.log('outputting player state');
		});
		room.on('play play_new', function(video){
			if (!mod) return;
			sock.emit('play_video', video.toJSON());
		});
		room.on('delete', function(video){
			if (!mod) return;
			sock.emit('remove_video', video.toJSON());
		});
		room.on('queue', function(video){
			if (!mod) return;
			sock.emit('add_queue', video.toJSON())
		});
		room.on('playlist', function(video){
			if (!mod) return;
			sock.emit('add_playlist', video.toJSON());
		});
		room.on('clear', function(list){
			if (!mod) return;
			sock.emit('clear',list);
		});
		user.on('login', function(){
			sock.emit('login', user.toJSON());
		});
		user.on('logout', function(){
			sock.emit('logout');
		});
		room.bind('mod', function(user){
			if (!isowner) return;
			console.log('mod');
			sock.emit('mod', user.id);
		});
		room.bind('mute', function(user){
			if (!mod) return;
			sock.emit('mute', user.id);
		});
		room.bind('avatar', function(email){
			sock.emit('avatar', email);
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
		sock.on('modlist', function(modlist){
			room.get('modlist').reset(modlist);
		});
		sock.on('mutelist', function(mutelist){
			room.get('mutelist').reset(mutelist);
		});
		sock.on('message', function(message){
			if (room.get('hidelist').get(message.author)) return;
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
		sock.on('refresh', function(){
			document.location.reload(true);
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