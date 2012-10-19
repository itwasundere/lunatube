var PlaylistView = Backbone.View.extend({
	initialize: function() {
		this.model.bind('add remove', this.render, this);
		this.model.bind('selected', this.render, this);
		this.model.bind('reset', this.render, this);
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
		this.template = _.template($('script#video').html());
	},
	render: function() {
		var el = this.$el, self = this;
		el.hover(function(){
			el.attr('class','hover');
		}, function(){
			el.attr('class','');
		});
		if (this.options.selected)
			el.attr('class','selected');
		else el.attr('class','');
		el.click(function(){
			self.model.trigger('selected', self.model);
		});
		var html = $(this.template(this.model.toJSON()));
		el.attr('id', html.attr('id'))
		el.html(html.html());
	}
});