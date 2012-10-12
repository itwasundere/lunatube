var chromeless = 'http://www.youtube.com/apiplayer?version=3&enablejsapi=1&playerapiid=player1';

var PlayerView = Backbone.View.extend({
	initialize: function(){
		var self = this;
		if (!this.options.dimensions)
			this.options.dimensions = { width: 640, height: 360 };
		window.onYouTubePlayerReady = function() {
			self.ready() }
	},
	ready: function() {
		this.player = document.getElementById('apiplayer');
		this.trigger('ready');
	},
	set_video: function(video){
		if (!player) return;
		this.player.cueVideoById(video.get('url'));
	},
	update: function(playback){
		if (!this.player) return;
		var my_time = this.player.getCurrentTime();
		var leader_time = playback.time;
		if (this.state == 3) // buffering
			return;
		if (Math.abs(leader_time - my_time) > this.get('tolerance'))
			this.player.seekTo(leader_time, true);
		if (playback.video.id != this.get('video').id)
			this.set_video(new Video(playback.video));
		if (playback.state != this.player.getPlayerState())
			if (playback.state == 1)
				this.player.playVideo();
			else {
				this.player.pauseVideo();
				this.player.seekTo(leader_time, true);
			}
		this.trigger('state');
	},
	play: function(){
		if (!globals.leader) return;
		if (!this.player) return;
		this.player.playVideo();
		/*this.get('server').emit('video', {
			playback: {
				seek: this.player.getCurrentTime(),
				state: this.player.getPlayerState()
			}
		});*/
		this.trigger('state');
	},
	pause: function(){
		if (!globals.leader) return;
		if (!this.player) return;
		this.player.pauseVideo();
		/*this.get('server').emit('video', {
			playback: {
				seek: this.player.getCurrentTime(),
				state: this.player.getPlayerState()
			}
		});*/
		this.trigger('state');
	},
	volume: function(vol){
		if (!this.player) return;
		this.player.setVolume(vol);
	},
	playing: function() {
		if(!this.player) return false;
		return this.player.getPlayerState() == 1;
	},
	duration: function() {
		if (!this.player) return 1;
		return this.player.getDuration();
	},
	percentage: function() {
		if (!this.player) return 0;
		return this.player.getCurrentTime() / this.player.getDuration();
	},
	seek: function(seconds) {
		if (!globals.leader) return;
		/*this.get('server').emit('video', {
			playback: {
				seek: seconds - 2,
				state: this.player.getPlayerState()
			}
		});*/
	}
});

var PlayerView = Backbone.View.extend({
	render: function() {
		if (!this.model) return;
		var el = $(this.el), self = this, player = this.model;
		if (window.swfobject)
		swfobject.embedSWF(
			player.get('apiplayer_url'),
			el.attr('id'),
			String(player.get('dimensions').width),
			String(player.get('dimensions').height),
			'9', null, null,
			{allowScriptAccess: 'always'},
			{id: 'apiplayer'}
		);
	}
});

var ControlsView = Backbone.View.extend({
	initialize: function() {
		this.model.bind('state', this.render, this);
		var self = this;
		this.$el.find('#play').click(function(){
			if (self.model.playing()){
				self.model.pause();
			} else {
				self.model.play();
			}
		});
	},
	render: function() {
		var el = $(this.el), self = this;
		if (this.model.playing()){
			if (this.display == 'pausebtn') return;
			el.find('#play').html('<img src="/static/img/pause.png">');
			this.display = 'pausebtn';
		} else {
			if (this.display == 'playbtn') return;
			el.find('#play').html('<img src="/static/img/play.png">');
			this.display = 'playbtn';
		}
	}
});

var ScrobblerView = Backbone.View.extend({
	initialize: function() {
		var el = this.$el, self = this;
		var playhead = el.find('#playhead');
		setInterval(function(){ 
			self.render();
		}, 250);
		el.click(function(event){
			var percentage = event.offsetX / (el.width() - playhead.width());
			var seek = percentage * self.model.duration();
			self.model.seek(seek);
		});
	},
	render: function() {
		var el = this.$el, self = this;
		var playhead = el.find('#playhead');
		var percentage = this.model.percentage();
		var margin = (el.width() - playhead.width()) * percentage;
		if (!margin) playhead.css('visibility','hidden');
		else {
			playhead.css('visibility','');
			playhead.css('margin-left', margin);
		}
	}
})