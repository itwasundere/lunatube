window.LoginView = Backbone.View.extend({
	initialize: function() {
		this.model.bind('change reset', this.render, this);
	},
	render: function() {
		var el = this.$el;
		if (this.model.id && (this.model.id + '') < 32) {
			el.find('input').remove();
			var un = $('<div id="username">')
			un.html(this.model.get('username'));
			el.html(un);
		}
		else {
			var un = el.find('#username');
			var pw = el.find('#password');
			var model = this.model;
			var login = function() {
				model.set({
					username: un.val(),
					password: pw.val()
				});
				model.trigger('login');
			};
			el.find('#login_button').click(login);
			el.find('#reg_button').click(login);
		}
	}
});