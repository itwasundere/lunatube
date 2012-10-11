var ConnectionApi = Backbone.Model.extend({
	initialize: function() {
		var socket = io.connect(this.get('ip'));
		this.set('socket', socket);
		this.bind_events();
	},
	bind_events: function() {
		var sock = this.get('socket');
		sock.on('connected', function(data){
			console.log('connected');
			sock.emit('join',{}); });
		sock.on('chat', function(data){
			console.log(data);
			console.log(data);
		});
		// todo -- connecta fter binds
		sock.connect();
	}
});