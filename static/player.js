var chromeless = 'http://www.youtube.com/apiplayer?version=3&enablejsapi=1&playerapiid=player1';

var jtv = '<object type="application/x-shockwave-flash" height="480" width="853" id="jtv_player_flash" data="http://www.justin.tv/widgets/jtv_player.swf?channel=[[chan]]" bgcolor="#000000"><param name="allowFullScreen" value="true" /><param name="allowscriptaccess" value="always" /> <param name="movie" value="http://www.justin.tv/widgets/jtv_player.swf" /><param name="flashvars" value="channel=[[chan]]&auto_play=false&start_volume=50&watermark_position=top_right&auto_play=true" /></object>';
var livestream = '<iframe id="ls_player_flash" width="853" height="480" src="http://cdn.livestream.com/embed/[[chan]]?layout=4&amp;height=480&amp;width=853&amp;autoplay=true" style="border:0;outline:0" frameborder="0" scrolling="no"></iframe>';

// todo -- make slider move on state change, not server change

var PlayerView = Backbone.View.extend({
	initialize: function(){
		var self = this, el = this.$el;
		if (!this.options.dimensions)
			this.options.dimensions = { width: 853, height: 480 };
		if (!this.options.tolerance)
			this.options.tolerance = 2; // 2 seconds max lag
		window.onYouTubePlayerReady = function() {
			self.ready() }
		this.model.bind('change', this.render, this);
		this.model.bind('tick', this.render, this);

		room.get('playlist').bind('reset add remove', this.render, this);
		room.get('queue').bind('reset add remove', this.render, this);
		room.get('player').bind('change:current', this.render, this);

		if (ismod(window.user)) {
			this.$el.find('#play').click(function(){
				if (self.model.get('state') == 'playing')
					self.model.pause();
				else self.model.play();
			});
		}
		this.$el.find('#overlay').click(function(){
			$('#apiplayer')[0].webkitRequestFullscreen();
		});
		$(document).bind('webkitfullscreenchange mozfullscreenchange fullscreenchange',function(anything){
			window.fullscreen = !window.fullscreen;
			if (!window.fullscreen)
				$('#apiplayer').css({width: '100%', height: '100%'});
			else $('#apiplayer').css({width: window.screen.width, height: window.screen.height});
		});

		var scrobbler = this.$el.find('#scrobbler');
		var playhead = this.$el.find('#playhead');

		if (ismod(window.user)) {
			scrobbler.click(function(event){
				var current = self.model.get('current');
				if (!current) return;
				var percentage = event.offsetX / (scrobbler.width() - playhead.width());
				var seek = Math.floor(percentage * current.get('time'));
				self.model.seek(seek);
			});
			scrobbler.hover(function(event){
				playhead.css('background-color','red');
			}, function(){
				playhead.css('background-color','white');
			});
		}

		var next = el.find('#next');
		var nextvid = el.find('#next_vid');
		if (!this.pliv || this.pliv.get('url') != room.next_video()) {
			var pliv = new PlaylistItemView({
				model: room.next_video(),
				el: nextvid
			});
			pliv.render();
			this.pliv = pliv;
		}
		nextvid.css({
			display:'none',
			position: 'absolute',
			left: -nextvid.width() + next.width(),
			top: -nextvid.height(),
			'text-align': 'left',
			'border': 'none'
		});
		next.hover(function(){
			nextvid.css('display','block');
		},function(){
			nextvid.css('display','none');
		});

		if (ismod(window.user))
			next.click(function(){
				if (room.next_video().get('url') == 'Bq6WULV78Cw') return;
				if (event.which!=3) {
					room.trigger('play', room.next_video());
					return;
				}
			});

		var volume = el.find('#volume');
		var slider = volume.find('#volume_slider');
		volume.hover(function(){
			el.find('#mute,#max').css('display','block');
		}, function() {
			el.find('#mute,#max').css('display','none');
		});

		el.find('#vol').mousedown(function(event){
			var perc = event.offsetX / $(this).width() * 100;
			self.volume(perc);
			slider.width(event.offsetX);
		});

		el.find('#max').click(function(){
			self.volume(100);
			slider.width('100%');
		});

		el.find('#mute').click(function(){
			self.volume(0);
			slider.width(0);
		});
		var title = this.$el.find('#vid_title');
		title.click(function(){
			var url = 'http://youtube.com/watch?v='+self.model.get('current').get('url')
			window.open(url,'_blank');
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
			this.player.setPlaybackQuality('large')
			// 1 = playing, 2 paused, 3 buffering
			if (mstate == 'playing' && (pstate != 1 && pstate != 3))
				this.player.playVideo();
			else if (mstate == 'paused' && (pstate == 1))
				this.player.pauseVideo();
		}
		
		this.pliv.model = room.next_video();
		this.pliv.render();

		if (this.model.get('state') == 'playing') {
			if (ismod(window.user))
				el.find('#play').html('pause');
			else el.find('#play').html('playing');
		} else {
			if (ismod(window.user))
				el.find('#play').html('play');
			else el.find('#play').html('paused');
		}

		var title = this.$el.find('#vid_title');
		title.html('Now Playing: '+self.model.get('current').get('title'));
		
		// scrobbler
		var playhead = el.find('#playhead');
		var scrobbler = el.find('#scrobbler');
		var percentage = this.model.get('time') / this.model.get('current').get('time');
		var margin = (scrobbler.width() - playhead.width()) * percentage;
		playhead.css('visibility','');
		playhead.css('margin-left', margin);

		var ph_time = $('#ph_time');
		ph_time.html(self.model.time());
		ph_time.css({
			left: margin - ph_time.width()/2,
			top: -ph_time.height() - 8
		});

		if (this.model.get('current') && this.model.get('current').get('title'))
			$('#banner').html(this.model.get('current').get('title'));

		var livestream = room.get('livestream');
		var jtv = room.get('jtv');
		if (livestream && !$('#ls_player_flash').length)
			this.livestream(livestream);
		else if (jtv && !$('#jtv_player_flash').length)
			this.jtv(jtv);

	},
	livestream: function(chan) {
		var html = _.template(livestream, {chan: chan});
		this.tv = true;
		$('#apiplayer').css('visibility','hidden');
		$('#ls_player_flash').remove();
		$('#jtv_player_flash').remove();
		$('#player').prepend(html);
		$('#invisible').css('display','none');
	},
	jtv: function(chan) {
		var html = _.template(jtv, {chan: chan});
		this.tv = true;
		$('#apiplayer').css('visibility','hidden');
		$('#ls_player_flash').remove();
		$('#jtv_player_flash').remove();
		$('#player').prepend(html);
		$('#invisible').css('display','none');
	},
	nojtv: function() {
		this.tv = false;
		$('#ls_player_flash').remove();
		$('#jtv_player_flash').remove();
		$('#invisible').css('display','block');	
		$('#apiplayer').css('visibility','');
	},
	ready: function() {
		this.player = document.getElementById('apiplayer');
		if (cookie('volume'))
			this.volume(parseInt(cookie('volume')));
		else this.volume(50);
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
		cookie('volume',vol)
		if (!this.player) return;
		this.player.setVolume(vol);
		var size = this.$el.find('#vol').width()*vol/100;
		this.$el.find('#volume_slider').width(size);
	}
});
