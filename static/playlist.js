var PlaylistView = Backbone.View.extend({
	initialize: function() {
		this.model.bind('add remove', this.render, this);
		this.model.bind('selected', this.render, this);
		this.subviews = {};
	},
	render: function() {
		var self = this, el = this.$el;
		this.$el.empty();
		this.model.each(function(item){
			var piv = self.subviews[item.cid];
			if (!piv) {
				piv = new PlaylistItemView({model: item});
				self.subviews[item.cid] = piv;
			}
			else piv.options.selected = false;
			piv.render();
			el.append(piv.el);
		});
	}
})

var PlaylistItemView = Backbone.View.extend({
	initialize: function() {
		this.model.bind('change', this.render, this);
		this.template = _.template($('script#video_list').html());
	},
	render: function() {
		var el = this.$el, self = this;
		el.hover(function(){
			el.css('background-color','red');
		}, function(){
			el.css('background-color','');
		});
		if (this.options.selected)
			el.css('background-color','yellow');
		else el.css('background-color','');
		el.click(function(){
			self.model.trigger('selected', self.model);
		});
		el.html(this.template({
			title: this.model.get('title'),
			uploader: this.model.get('uploader'),
			time: this.model.get('time_text')
		}));
	}
});