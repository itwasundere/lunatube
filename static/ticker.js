var TickerView = Backbone.View.extend({
	initialize: function() {
		if (!google) return;
		this.feed = new google.feeds.Feed('http://feeds.feedburner.com/EquestriaDaily');
		this.feed.setNumEntries(10);
		this.fetch_feeds();
		this.model = new Backbone.Collection();
		var self = this;
		setInterval(function(){self.flip()},5000);
		this.render();
		this.$el.find('#hide').click(function(){
			self.$el.remove();
		});
		$('#admin').css({
			'margin': 'auto',
			'width': '1280',
			'background-color': '#ddd'
		});
		if ($.browser.chrome && parseInt($.browser.version)>=23)
			$('#admin').remove();
		$('#news').css({
			'margin': 'auto',
			'background-color': '#ddd',
			'width': '500px',
			'padding': '10px 20px',
			'text-align': 'center',
			'margin-bottom': '30px'
		});
	}, 
	render: function(){
		var el = this.$el;
		// todo: put this in the .less file
		el.find('#ttitle, #inner').css({
			'float':'left',
			'margin': '5px',
			'color': '#00C2FF'
		});
		el.css({
			'margin': 'auto',
			'width': '1280',
			'background-color': '#ddd'
		});
		el.find('#hide').css({
			'float': 'right',
			'margin': '5px',
			'cursor': 'pointer'
		});
	},
	fetch_feeds: function() {
		var self = this;
		this.feed.load(function(result){
			if (!result || !result.feed || !result.feed.entries || !result.feed.entries.length) return;
			$.each(result.feed.entries, function(idx, entry){
				self.model.add({
					title: entry.title,
					link: entry.link
				});
			});
			self.flip();
		});
	},
	flip: function() {
		var story = this.model.at(parseInt(Math.random()*this.model.length));
		var el = this.$el;
		el.find('#inner').animate({ opacity: 0 },500,function(){
			el.find('#text').text(story.get('title'));
			el.find('a').attr('href', story.get('link'));
			el.find('a').attr('target', '_blank');
			el.find('#inner').animate({ opacity: 1 }, 500);
		});
	}
});