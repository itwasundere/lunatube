window.LoginView = Backbone.View.extend({
	initialize: function() {
		this.model.bind('change reset', this.render, this);
		var el = this.$el;
		var un = el.find('#unfield');
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
		el.find('#logout').click(function(){
			model.trigger('logout');
		});
	},
	render: function() {
		var el = this.$el;
		if (this.model.id && (this.model.id + '').length < 32) {
			el.find('#username').css('display', '');
			el.find('#fields').css('display', 'none');
			el.find('#username').html(this.model.get('username'));
		}
		else {
			el.find('#username').css('display', 'none');
			el.find('#fields').css('display', '');
		}
	}
});