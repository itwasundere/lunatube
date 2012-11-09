window.UserListView = Backbone.View.extend({
	initialize: function() {
		this.model.bind('add remove reset', this.render, this);
		room.get('modlist').bind('add remove reset', this.render, this);
		room.get('mutelist').bind('add remove reset', this.render, this);
		room.get('hidelist').bind('add remove reset', this.render, this);
		this.subviews = {};
		var btn = this.$el.find('#header #user');
		var el = this.$el.find('#users');
		btn.click(function(){
			if (el.css('display') == 'none')
				el.css('display','block');
			else el.css('display','none');
		});
		this.$el.find('#cam').click(function(){
			if (!$(this).hasClass('selected')) {
				cams.join();
				$(this).toggleClass('selected');
			} else {
				cams.quit();
			}
		});
	},
	render: function() {
		var btn = this.$el.find('#header #user');
		btn.html(this.model.length + ' Users');
		var el = this.$el.find('#users').empty();
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
			avatar: this.model.avatar(),
			username: this.model.get('username')
		}));
		if (ismod(model)) {
			el.find('#mod.button').addClass('selected');
		} else if (!isowner(window.user))
			el.find('#mod.button').remove();
		if (room.get('mutelist').get(model.id))
			el.find('#mute.button').addClass('selected');
		else if (!ismod(window.user))
			el.find('#mute.button').remove();
		if (room.get('hidelist').get(model.id))
			el.find('#hide.button').addClass('selected');
		if (isowner(window.user))
			el.find('#mod.button').hover(function(){
				$(this).addClass('hovered');
			},function(){
				$(this).removeClass('hovered');
			});
		if (isowner(window.user))
			el.find('#mod.button').click(function(){
				room.trigger('mod', model);
			});
		else {
			el.find('#mod').removeClass('button');
			el.find('#mod').addClass('disabled_button');
		}
		if (!ismod(window.user)) {
			el.find('#mute').removeClass('button');
			el.find('#mute').addClass('disabled_button');
		}
		else {
			el.find('#mute.button').click(function(){
				room.trigger('mute', model);
			});
		}
		el.find('#hide.button').click(function(){
			var prev = room.get('hidelist').get(model.id);
			if (prev) room.get('hidelist').remove(prev);
			else room.get('hidelist').add(model);
		});
	}
})