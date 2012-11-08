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
		if (cookie('theme')) {
			$('link').attr('href','static/themes/'+cookie('theme')+'.less');
			less.refresh();
		}
		el.find('#themes').click(function(){
			if ($('#tmenu').length) {
				$('#tmenu').remove();
				return;
			}
			var div = $('<div id="tmenu">\
					<div id="luna">luna</div>\
					<div id="twilight">twilight</div>\
					<div id="applejack">applejack</div>\
					<div id="pinkie">pinkie</div>\
					<div id="rarity">rarity</div>\
					<div id="fluttershy">fluttershy</div>\
					<div id="rainbow">rainbow</div>\
					<div id="simple">monoshy</div>\
				</div>');
			div.css({
				position: 'absolute',
				top: $(this).offset().top+32,
				left: $(this).offset().left
			});
			div.find('#pinkie').click(function(){
				cookie('theme', 'pinkie');
				$('link').attr('href','static/themes/pinkie.less');
				less.refresh();
				$('#tmenu').remove();
			});
			div.find('#luna').click(function(){
				cookie('theme', 'luna');
				$('link').attr('href','static/themes/luna.less');
				less.refresh();
				$('#tmenu').remove();
			});
			div.find('#twilight').click(function(){
				cookie('theme', 'twilight');
				$('link').attr('href','static/themes/twilight.less');
				less.refresh();
				$('#tmenu').remove();
			});
			div.find('#applejack').click(function(){
				cookie('theme', 'applejack');
				$('link').attr('href','static/themes/applejack.less');
				less.refresh();
				$('#tmenu').remove();
			});
			div.find('#rarity').click(function(){
				cookie('theme', 'rarity');
				$('link').attr('href','static/themes/rarity.less');
				less.refresh();
				$('#tmenu').remove();
			});
			div.find('#rainbow').click(function(){
				cookie('theme', 'rainbow');
				$('link').attr('href','static/themes/rainbow.less');
				less.refresh();
				$('#tmenu').remove();
			});
			div.find('#fluttershy').click(function(){
				cookie('theme', 'fluttershy');
				$('link').attr('href','static/themes/fluttershy.less');
				less.refresh();
				$('#tmenu').remove();
			});
			div.find('#simple').click(function(){
				cookie('theme', 'simple');
				$('link').attr('href','static/themes/simple.less');
				less.refresh();
				$('#tmenu').remove();
			});
			$('body').append(div);
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
			$('body').append(div);
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