var PlaylistView = Backbone.View.extend({
	initialize: function() {
		this.model.bind('add remove', this.render, this);
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
		if (model.get('selected'))
			el.css('background-color','yellow');
		el.click(function(){
			self.model.trigger('selected');
		});
		el.html(this.template({
			title: this.model.get('title'),
			uploader: this.model.get('uploader'),
			time: this.model.get('time_text')
		}));
	}
});