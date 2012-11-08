var CamsView = Backbone.View.extend({
	join: function() {
		var el = this.$el;
		this.$el.css('display','block');
		var temp = _.template($('script#cam').html());
		if (!$.browser.chrome || parseInt($.browser.version) <23)
				alert('for cams to work properly, you should use chrome v23');
		var me = $(temp());
		me.click(function(){
			if ($(this).css('width')!='400px')
				$(this).css({width: 400, height: 300});
			else $(this).css({width: 160, height: 120});
		})
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
			peer.click(function(){
				if ($(this).css('width')!='400px')
					$(this).css({width: 400, height: 300});
				else $(this).css({width: 160, height: 120});
			})
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
