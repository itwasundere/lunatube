window.LoginView = Backbone.View.extend({
	initialize: function() {
		this.model.bind('change reset', this.render, this);
		var el = this.$el;
		var un = el.find('#unfield');
		var pw = el.find('#password');
		var model = this.model;
		var login = function() {
			if (!un.val() || !pw.val())
				alert('Please enter your registration credentials in the textboxes to the top right.');
			model.set({
				username: un.val(),
				password: pw.val()
			});
			model.trigger('login');
		};
		un.keydown(function(event){
			if (event.keyCode == 13) login();
		});
		pw.keydown(function(event){
			if (event.keyCode == 13) login();
		});
		el.find('#login_button').click(login);
		el.find('#reg_button').click(login);
		el.find('#logout').click(function(){
			model.trigger('logout');
		});
		el.find('#username').hover(function(event){
			var div = $('<div id="smenu">');
			div.css({
				width: 100,
				height: 100,
				'background-color': 'white',
				position: 'absolute',
				top: event.offsetY,
				left: $(this).screenX
			});
			var a = $(this);
			$('body').append(div);
		}, function(){
			$('#smenu').remove();
		});
	},
	render: function() {
		var el = this.$el;
		if (this.model.id && (this.model.id + '').length < 32) {
			el.find('#username').css('display', '');
			el.find('#logout').css('display', '');
			el.find('#fields').css('display', 'none');
			el.find('#username').html(this.model.get('username'));
			el.find('#avatar img').attr('src', this.model.get('avatar_url'));
		}
		else {
			el.find('#logout').css('display', 'none');
			el.find('#username').css('display', 'none');
			el.find('#fields').css('display', '');
		}
	}
});