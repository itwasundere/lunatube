var chromeless = 'http://www.youtube.com/apiplayer?version=3&enablejsapi=1&playerapiid=player1';

// todo -- make slider move on state change, not server change

var PlayerView = Backbone.View.extend({
	initialize: function(){
		var self = this, el = this.$el;
		if (!this.options.dimensions)
			this.options.dimensions = { width: 640, height: 360 };
		if (!this.options.tolerance)
			this.options.tolerance = 2; // 2 seconds max lag
		window.onYouTubePlayerReady = function() {
			self.ready() }
		this.model.bind('change', this.render, this);

		room.get('playlist').bind('reset', this.render_prevnext, this);
		room.get('queue').bind('reset', this.render_prevnext, this);
		room.get('player').bind('change:current', this.render_prevnext, this);

		this.$el.find('#play').click(function(){
			if (self.model.get('state') == 'playing')
				self.model.pause();
			else self.model.play();
		});
		this.$el.find('#overlay').click(function(){
			if (self.model.get('state') == 'playing')
				self.model.pause();
			else self.model.play();
		});

		var scrobbler = this.$el.find('#scrobbler');
		var playhead = this.$el.find('#playhead');
		scrobbler.click(function(event){
			var current = self.model.get('current');
			if (!current) return;
			var percentage = event.offsetX / (scrobbler.width() - playhead.width());
			var seek = Math.floor(percentage * current.get('time'));
			self.model.seek(seek);
		});
	},
	render: function() {
		var el = this.$el, self = this;
		if (!this.player && window.swfobject) {
			swfobject.embedSWF(
				chromeless,
				'youtube',
				String(this.options.dimensions.width),
				String(this.options.dimensions.height),
				'9', null, null,
				{allowScriptAccess: 'always'},
				{id: 'apiplayer'}
			);
		}
		
		if (this.player) {
			// time
			var mtime = this.model.get('time');
			var ptime = this.player.getCurrentTime();
			if (Math.abs(ptime - mtime) > this.options.tolerance)
				this.player.seekTo(mtime, true);
			// current
			var murl = this.model.get('current').get('url');
			var purl = get_yt_vidid(this.player.getVideoUrl());
			if (murl != purl)
				this.player.cueVideoById(murl);
			// state
			var mstate = this.model.get('state');
			var pstate = this.player.getPlayerState();
			// 1 = playing, 2 paused, 3 buffering
			if (mstate == 'playing' && (pstate != 1 && pstate != 3))
				this.player.playVideo();
			else if (mstate == 'paused' && (pstate == 1))
				this.player.pauseVideo();
		}

		/*
		// play button
		if (this.model.get('state') == 'playing' && !this.show_pause) {
			el.find('#play').html('<img src="/static/img/pause.png">');
			this.show_pause = true;
			this.show_play = false;
		}
		else if(this.model.get('state') == 'paused' && !this.show_play){
			el.find('#play').html('<img src="/static/img/play.png">');
			this.show_play = true;
			this.show_pause = false;
		}
		*/
		
		// scrobbler
		var playhead = el.find('#playhead');
		var scrobbler = el.find('#scrobbler');
		var percentage = this.model.get('time') / this.model.get('current').get('time');
		var margin = (scrobbler.width() - playhead.width()) * percentage;
		playhead.css('visibility','');
		playhead.css('margin-left', margin);

		// volume contorls
		var volume = el.find('#volume input');
		volume.change(function(){
			self.volume(parseInt(volume.val()));
		});

		if (this.model.get('current') && this.model.get('current').get('title'))
			$('#banner').html(this.model.get('current').get('title'));

	},
	render_prevnext: function() {
		// prevnext
		var pliv = new PlaylistItemView({
			model: room.next_video(),
			el: $('#next #video')
		});
		pliv.render();
		if (!this.model.get('prev')) return;
		var pliv = new PlaylistItemView({
			model: this.model.get('prev'),
			el: $('#prev #video')
		});
		pliv.render();
	},
	ready: function() {
		this.player = document.getElementById('apiplayer');
		this.volume(50);
		this.trigger('ready');
	},
	set_video: function(video){
		if (!player) return;
		this.player.cueVideoById(video.get('url'));
	},
	update: function(state){
		if (this.player) {
			// pause / play
			switch(this.model.get('state')){
				case 'playing': this.player.playVideo();
				case 'paused': this.player.pauseVideo();
			}
			// current time
			var my_time = this.player.getCurrentTime();
			if (state.time - this.player.get('time') > this.options.tolerance) {
				this.set('time', state.time);
			}
		}
	},
	play: function(){
		if (!this.player) return;
		this.player.playVideo();
	},
	pause: function(){
		if (!this.player) return;
		this.player.pauseVideo();
	},
	volume: function(vol){
		if (!this.player) return;
		this.player.setVolume(vol);
	}
});
