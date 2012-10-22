var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
	initialize: function() {
		if (!this.get('room'))
			return;
		this.bind_events();
	},
	bind_events: function() {
		var room = this.get('room');
		var userlist = room.get('userlist');
		var queue = room.get('queue');
		var playlist = room.get('playlist');
		var message = room.get('messages');
		var player = room.get('player');

		userlist.bind('add', function(model){
			console.log('userlist add    '+model.id+' '+userlist.length);
		});
		userlist.bind('remove', function(model){
			console.log('userlist remove '+model.id+' '+userlist.length);
		});
		queue.bind('add', function(model){
			console.log('queue add       '+model.id+' '+queue.length);
		});
		queue.bind('remove', function(model){
			console.log('queue remove    '+model.id+' '+queue.length);
		});
		playlist.bind('add', function(model){
			console.log('playlist add    '+model.id+' '+playlist.length);
		});
		playlist.bind('remove', function(model){
			console.log('playlist remove '+model.id+' '+playlist.length);
		});
		message.bind('add', function(model){
			console.log('message         '+model.get('content')+' '+message.length);
		});
		player.bind('change:state', function(){
			console.log('player state    '+player.get('state'));
		});
		player.bind('change:current', function(){
			console.log('player current  '+player.get('current').get('url'));
		});
		player.bind('change:time', function(){
			console.log('player time     '+player.get('time'));
		});
	}
});