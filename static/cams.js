var CamsView = Backbone.View.extend({
	join: function() {
		var el = this.$el;
		this.$el.css('display','block');
		var temp = _.template($('script#cam').html());
		
		var me = $(temp());
		el.append(me);
		rtc.createStream({video: true, audio: true}, function(stream){
			me.attr('src',URL.createObjectURL(stream));
		});

		rtc.connect('ws://'+window.location.hostname+':4000/', window.room.id);
		rtc.on('add remote stream', function(stream, socketId) {
			var peer = $(temp());
			peer.attr({
				id: socketId,
				src: URL.createObjectURL(stream)
			});
			el.append(peer);
		});
		rtc.on('disconnect stream', function(socketId) {
			$(document.getElementById(socketId)).remove()
		});
	},
	quit: function() {
		alert("there's no other way to quit cams other than to refresh the page. i'm getting this fixed as soon as possible.");
	}
});
