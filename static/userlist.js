window.UserListView = Backbone.View.extend({
	initialize: function() {
		this.model.bind('add remove reset', this.render, this);
		this.subviews = {};
	},
	render: function() {
		var btn = this.$el.find('#header #button');
		btn.html(this.model.length + ' Users');
		var el = this.$el.find('#users').empty();
		btn.click(function(){
			if (el.css('display') == 'none')
				el.css('display','block');
			else el.css('display','none');
		});
		var subv = this.subviews;
		this.model.each(function(user){
			var uv = subv[user.id];
			if (!uv) {
				uv = new UserView({ model: user });
				subv[user.id] = uv;
			}
			el.append(uv.el);
			uv.render();
		});
	}
});

window.UserView = Backbone.View.extend({
	initialize: function() {
		this.model.bind('change', this.render, this);
	},
	render: function() {
		var temp = _.template($('script#user').html());
		var model = this.model, el = this.$el;
		el.html(temp({
			avatar: this.model.get('avatar_url'),
			username: this.model.get('username')
		}));
		el.bind('contextmenu', function(event){
			$('#menu').remove();
			var menu = $('<div id="menu">'+
					'<div class="menuitem" id="mute">Mute</div>'+
					'<div class="menuitem" id="hide">Hide</div>'+
				'</div>');
			menu.css({
				position: 'absolute',
				left: event.offsetX,
				top: event.offsetY
			});
			menu.find('.menuitem').hover(function(){
				$(this).addClass('hover');
			}, function(){
				$(this).removeClass('hover');
			});
			menu.find('#mute').mousedown(function(event){
				model.trigger('mute');
				$('#menu').remove();
				el.removeClass('hover');
				event.preventDefault();
			});
			el.append(menu);
			event.preventDefault();
		});
	}
})