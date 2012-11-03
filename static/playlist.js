var CatalogView = Backbone.View.extend({
	initialize: function() {
		var el = this.$el, self = this;
		this.subviews = {};
		$.each(this.options.playlists, function(name, list){
			el.find('.section#'+name).click(function(){
				self.show(name);
			});
		});
		room.get('player').bind('change:current',this.show_current, this);
	},
	render: function() {
		var el = this.$el.find('#videos').empty(), self = this;
		$.each(this.options.playlists, function(name, list){
			var sel = $('<div>');
			var cel = self.$el.find('.section#'+name+' #count');
			el.append(sel);
			self.subviews[name] = new PlaylistView({
				model: list, el: sel, cel: cel });
			self.subviews[name].render();
		});	
		this.show_current();
	},
	show: function(name) {
		$.each(this.subviews, function(svn, sv){
			if (svn == name)
				sv.$el.css('display','block');
			else sv.$el.css('display','none');
		});
		this.$el.find('.section.selected').removeClass('selected');
		this.$el.find('.section#'+name).addClass('selected');
	},
	show_current: function() {
		var self = this;
		$.each(this.options.playlists, function(name, list){
			var current = room.get('player').get('current');
			if (list.get(current.id))
				self.show(name);
		});
	}
});

var PlaylistView = Backbone.View.extend({
	initialize: function() {
		this.model.bind('add remove reset', this.render, this);
		room.get('player').bind('change:current', this.render_current, this);
		this.subviews = {};
	},
	render: function() {
		var self = this, el = this.$el.empty();
		this.options.cel.html('('+this.model.length+')');
		this.model.each(function(item){
			var piv = self.subviews[item.id];
			if (!piv) {
				piv = new PlaylistItemView({
					model: item, removable: true,
				});
				self.subviews[item.id] = piv;
			}
			el.append(piv.el);
			piv.render();
		});
		this.render_current();
	},
	render_current: function() {
		this.$el.find('#video.selected').removeClass('selected');
		var v = this.subviews[room.get('player').get('current').id];
		if (v) v.$el.addClass('selected');
	}
})

var PlaylistItemView = Backbone.View.extend({
	initialize: function() {
		this.model.bind('change', this.render, this);
		this.template = _.template($('script#video').html());
		var el = this.$el, self = this;
		el.find('#thumbnail, #info').click(function(event){
			room.trigger('play', self.model);
			return;
		});
	},
	render: function() {
		var el = this.$el, self = this;
		var html = $(this.template(this.model.toJSON()));
		el.html(html.html());
		if (this.options.removable) {
			el.hover(function(){
				el.find('#actions').css('display','block');
			}, function(){
				el.find('#actions').css('display','none');
			});
			el.find('#open').click(function(){
				var str = 'http://youtube.com/watch?v='+self.model.get('url');
				window.open(str,'_blank');
			});
			el.find('#delete').click(function(){
				window.room.trigger('delete', self.model);
			});
		}
		el.attr('id', html.attr('id'))
	}
});