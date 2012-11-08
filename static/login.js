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
		el.find('#username').click(function(event){
			if ($('#smenu').length) {
				$('#smenu').remove();
				return;
			}
			var div = $('<div id="smenu">\
					<div id="prefs">preferences</div>\
					<div id="logout">logout</div>\
				</div>');
			div.css({
				position: 'absolute',
				width: $(this).width()+12*2,
				top: $(this).offset().top+32,
				left: $(this).offset().left
			});
			div.find('#prefs').click(function(){

			});
			div.find('#logout').click(function(){
				$('#smenu').remove();
				model.trigger('logout');
			});
			var a = $(this);
			$('body').append(div);
			div.click({

			});
		});
	},
	render: function() {
		var el = this.$el;
		if (this.model.id && (this.model.id + '').length < 32) {
			el.find('#status').css('display', '');
			el.find('#logout').css('display', '');
			el.find('#fields').css('display', 'none');
			el.find('#username').html(this.model.get('username'));
			el.find('#avatar img').attr('src', this.model.get('avatar_url'));
		}
		else {
			el.find('#logout').css('display', 'none');
			el.find('#status').css('display', 'none');
			el.find('#fields').css('display', '');
		}
	}
});