add_globals({ 
	vidinfo: 'http://gdata.youtube.com/feeds/api/videos/[[videoid]]?v=2&alt=json' });

window.Video = Backbone.Model.extend({
	defaults: {title: '', uploader: '', time: '', thumb: '', url: ''},
	initialize: function() {
		if (!this.get('url')) return;
		var infourl = _.template(globals.vidinfo, {videoid: this.get('url')});
		var self = this;
		$.get(infourl, function(data){
			self.set({
				title: data.entry.title.$t,
				uploader: data.entry.author[0].name.$t,
				seconds: parseInt(data.entry.media$group.yt$duration.seconds),
				thumb: data.entry.media$group.media$thumbnail[0].url
			});
			var minutes = Math.floor(self.get('seconds')/60);
			var seconds = self.get('seconds')%60;
			self.set({ time: minutes+':'+seconds });
		});
	},
	url: function() {
		return 'http://youtube.com/watch?v='+this.get('url');
	}
});

window.VideoList = Backbone.Collection.extend({
	model: window.Video,
	comparator: function(video){
		return video.get('queue_order');
	},
	get_current: function(){
		if (!this.current)
			this.current = this.at(0);
		return this.current;
	},
	get_next: function() {
		var current = this.current;
		if (!current) return this.at(0);
		for (var a=0; a<this.length; a++)
			if (this.at(a) == current)
				return this.at(a+1) || this.at(0);
	},
	get_prev: function() {
		var current = this.current;
		if (!current) return this.at(this.length-1);
		for (var a=0; a<this.length; a++)
			if (this.at(a) == current)
				return this.at(a-1) || this.at(this.length-1);
	},
	select: function(vid) {
		this.current = vid;
		this.trigger('selected');
	},
	status: function() {
		return {
			current_id: this.get_current().get('id')
		};
	}
});

window.PrevNextView = Backbone.View.extend({
	initialize: function() {
		if (this.model) this.model.bind('selected', this.render, this);
	},
	render: function() {
		var el = this.$el;
		if (!this.model) console.error('no model');
		var next = el.find('#queue_next #queue_vids');
		var prev = el.find('#queue_prev #queue_vids');
		var nextel = $('<div>');
		next.html(nextel);
		var prevel = $('<div>');
		prev.html(prevel);
		var nextview = new VideoView({ 
			model: this.model.get_next(),
			el: nextel
		});
		var prevview = new VideoView({ 
			model: this.model.get_prev(),
			el: prevel
		});
		nextview.render();
		prevview.render();
	}
});

window.PlaylistView = Backbone.View.extend({
	initialize: function() {
		var self = this;
		this.model.each(function(video){
			video.bind('selected', function(){
				self.model.select(video);
			});
		})
	},
	render: function() {
		var self = this;
		this.model.each(function(vid){
			var vv = new VideoView({ model: vid });
			vv.render();
			self.$el.append(vv.el);
		});
	}
});

window.VideoView = Backbone.View.extend({ 
	initialize: function() {
		this.html = $('script#video').html();
		if (this.model)
			this.model.bind('change', this.render, this);
	},
	render: function() {
		if(!this.model) return;
		var html = $(_.template(this.html, this.model.toJSON()));
		var self = this;
		this.$el.attr('id',html.attr('id'));
		this.$el.attr('class',html.attr('class'));
		this.$el.html(html[0].children);
		this.$el.click(function(){
			self.model.trigger('selected');
		});
	}
});
