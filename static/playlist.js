var PlaylistView = Backbone.View.extend({
	initialize: function() {
		this.model.bind('add remove', this.render, this);
		room.get('player').bind('change:current', this.render, this);
		this.model.bind('reset', this.render, this);
		this.subviews = {};
	},
	render: function() {
		var self = this, el = this.$el.find('#videos');
		el.empty();
		this.model.each(function(item){
			var piv = self.subviews[item.cid];
			if (!piv) {
				piv = new PlaylistItemView({model: item});
				self.subviews[item.cid] = piv;
			}
			if (room.get('player').get('current').id == item.id)
				piv.options.selected = true;
			else piv.options.selected = false;
			piv.render();
			el.append(piv.el);
			$('body').click(function(){
				$('#menu').remove();
			});
		});
		var name = this.$el.find('.header').html();
		if (starts_with(name, 'Playlist'))
			name = 'Playlist ('+this.model.length+')';
		else if (starts_with(name, 'Queue'))
			name = 'Queue ('+this.model.length+')';
		this.$el.find('.header').html(name);
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
			el.addClass('hover');
		}, function(){
			el.removeClass('hover');
		});
		if (this.options.selected)
			el.addClass('selected');
		else el.removeClass('selected');
		var html = $(this.template(this.model.toJSON()));
		el.attr('id', html.attr('id'))
		el.html(html.html());
		el.click(function(event){
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
			el.append(menu);
			event.preventDefault();
		});
	}
});