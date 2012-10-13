/*
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
		ip: 'ws://localhost:8080/',
		room: models.Room();
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
}*/

$(document).ready(function(){
	window.room = new models.Room();
	for (idx in globals.room) {
		var attr = globals.room[idx];
		if (typeof(attr) == 'object') {
			var obj = room.get(idx);
			if (obj.reset) obj.reset(attr);
			else if (obj.set) {
				for (idx2 in attr) {
					var val = attr[idx2];
					var attr2 = obj.get(idx2);
					if (typeof(val) != 'object')
						obj.set(idx2, val);
					else if (attr2.set) attr2.set(val);
					else if (attr2.reset) attr2.reset(val);
				}
			}
		}
	}
	window.api = new ConnectionApi({
		ip: 'ws://localhost:8080/',
		room: window.room
	});
	window.pv = new PlaylistView({
		model: room.get('playlist'), 
		el: $('#playlist_vids')
	});
	pv.render();
	window.plv = new PlayerView({
		el: $('#col_left'),
		model: room.get('player')
	});
	plv.render();
});
