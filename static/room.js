load_login = function(){
	window.me = new User(globals.user);
	var next = function(){};
	if(globals.me && globals.me.id)
		$('#login').css('visibility','hidden');
	$('input#login').click(function(){
		$.post('/login', {
			username: $('input#username').val(),
			password: $('input#password').val()
		}, next);
	});
}

load_server = function(){
	window.api = new ConnectionApi({
		ip: 'ws://localhost:8080/'
	});
}

load_queue = function(){
	window.playlist = new VideoList(globals.room.playlist);
	window.pv = new PlaylistView({
		model: playlist,
		el: $('#playlist #videos')
	});
	pv.render();
	window.prevnext = new PrevNextView({
		model: playlist,
		el: $('#queue')
	});
	prevnext.render();
}

load_player = function(){
	window.player = new Player({
		vidid: '',
		playlist: window.playlist
	});
	window.pv = new PlayerView({model: player, el: $('#vid_player2')});
	pv.render();
	// todo: put this in controlview
	var vol = $('#vol_controls input');
	vol.change(function(){ player.volume(parseInt(vol.val())); });
	// player.volume(parseInt(vol.val()));
	window.ctrlv = new ControlsView({
		el: $('#vid_controls'),
		model: player
	});
	window.scv = new ScrobblerView({
		el: $('#scrobbler'),
		model: player
	})
	ctrlv.render();
}

load_chat = function() {
	window.chat = new Chat({
		me: window.me
	});
	window.cv = new ChatView({
		el: $('#chat'),
		model: chat
	});
	cv.render();
}

$(document).ready(function(){
	load_login();
	load_server();
	load_queue();
	load_player();
	load_chat();
});
