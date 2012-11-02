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
	window.room.id = globals.room.id;
	window.user = new models.User(globals.user);
	window.api = new ConnectionApi({
		ip: 'ws://'+window.location.host,
		room: window.room,
		user: window.user,
		refresh: 1000
	});
	window.pv = new PlaylistView({
		model: room.get('playlist'), 
		el: $('#playlist'),
		hidden: true
	});
	pv.render();
	window.qv = new PlaylistView({
		model: room.get('queue'), 
		el: $('#queue')
	});
	qv.render();
	window.plv = new PlayerView({
		el: $('#theater'),
		model: room.get('player'),
		tolerance: 5
	});
	room.get('player').get('current').initialize();
	plv.render();
	window.cv = new ChatView({
		el: $('#chatroom'),
		model: room
	});
	cv.render();
	window.ulv = new UserListView({
		el: $('#chatroom'),
		model: room.get('userlist')
	});
	ulv.render();
	window.liv = new LoginView({
		el: $('#login'),
		model: window.user
	});
	liv.render();

	$('body').click(function(){
		$('#menu').remove();
	});

	// disable text drag select for non-chat elements
	$('#theater')[0].onselectstart = function(){ return false; }
	$('#catalog')[0].onselectstart = function(){ return false; }
	$('#header')[0].onselectstart = function(){ return false; }
});