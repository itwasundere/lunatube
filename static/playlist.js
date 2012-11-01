var PlaylistView = Backbone.View.extend({
	initialize: function() {
		this.model.bind('add remove', this.render, this);
		room.get('player').bind('change:current', this.render_current, this);
		this.model.bind('reset', this.render, this);
		this.subviews = {};
		var self = this;
		var header = this.$el.find('.header');
		var el = this.$el.find('#videos')
		header.click(function(){
			self.options.hidden = !self.options.hidden;
			self.render();
		});
	},
	render: function() {
		var self = this, el = this.$el.find('#videos');
		el.empty();
		if (!self.options.hidden)
		this.model.each(function(item){
			var piv = self.subviews[item.id];
			if (!piv) {
				piv = new PlaylistItemView({
					model: item,
					removable: true
				});
				self.subviews[item.id] = piv;
			}
			piv.render();
			el.append(piv.el);
		});
		
		var name = this.$el.find('.header').html();
		if (contains(name, 'Playlist'))
			name = 'Playlist ('+this.model.length+')';
		else if (contains(name, 'Queue'))
			name = 'Queue ('+this.model.length+')';
		if (this.options.hidden)
			name = '> ' + name;
		else name = 'v ' + name;
		this.$el.find('.header').html(name);
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
		el.click(function(event){
			if (self.model.get('url') == 'Bq6WULV78Cw') return;
			if (event.which!=3) {
				room.trigger('play', self.model);
				return;
			}
		});

		el.bind('contextmenu', function(event){
			$('#menu').remove();
			var menu = $('<div id="menu">'+
					'<div class="menuitem" id="open">Open video in new tab</div>'+
					'<div class="menuitem" id="remove">Remove from list</div>'+
				'</div>');
			menu.css({
				position: 'absolute',
				left: event.pageX,
				top: event.pageY
			})
			menu.find('.menuitem').hover(function(){
				$(this).addClass('hover');
			}, function(){
				$(this).removeClass('hover');
			});
			menu.find('#open').mousedown(function(event){
				var str = 'http://youtube.com/watch?v='+self.model.get('url');
				window.open(str,'_blank');
				$('#menu').remove();
				el.removeClass('hover');
				event.preventDefault();
			});
			if (self.options.removable)
				menu.find('#remove').mousedown(function(event){
					window.room.trigger('delete', self.model);
					$('#menu').remove();
					el.removeClass('hover');
					event.preventDefault();
				});
			else menu.find('#remove').remove();
			el.append(menu);
			event.preventDefault();
		});
	},
	render: function() {
		var el = this.$el, self = this;
		var html = $(this.template(this.model.toJSON()));
		el.attr('id', html.attr('id'))
		el.html(html.html());
	}
});