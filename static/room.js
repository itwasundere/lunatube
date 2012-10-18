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
		ip: 'ws://localhost:8080/',
		room: window.room,
		refresh: 1000
	});
	window.pv = new PlaylistView({
		model: room.get('playlist'), 
		el: $('#playlist #videos')
	});
	pv.render();
	window.plv = new PlayerView({
		el: $('#theater'),
		model: room.get('player')
	});
	plv.render();
	window.cv = new ChatView({
		el: $('#chatroom'),
		model: room
	});
	cv.render();
	
});