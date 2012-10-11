var Server = Backbone.Model.extend({
	defaults: {
		debug: true,
		ip: globals.debug_server
	},
	initialize: function() {
		var self = this;
	},
	connect: function() {
		var self = this;
		this.socket = io.connect(this.get('ip'));
	},
	on: function(key, receive) {
		var self = this;
		this.socket.on(key, function(data){
			if (self.get('debug')); {
				console.log('on '+key);
				console.log(data);
			}
			receive(data);
		});
	},
	emit: function(key, data) {
		if (this.get('debug')) {
			console.log('sending '+key);
			console.log(data);
		}
		this.socket.emit(key, data);
	}
});