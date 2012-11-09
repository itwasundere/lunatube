var PrefsView = Backbone.View.extend({
	initialize: function(){
		window.user.bind('change reset', this.render, this);
		this.template=_.template('<div id="prefs">\
			<div id="title">Preferences</div>\
			<div id="avatar">\
				<div><a href="http://gravatar.com" target="_blank"><b>Gravatar</b></a> email</div>\
				<img src="[[gravatar]]" />\
				<input type="text"></input>\
			</div>\
			<div id="save" class="button">save</div>\
			<div class="small">changes will take effect after refresh</div>\
		</div>');
	},
	render: function() {
		var el = this.$el;
		// todo -- put this spaghetti in the css once you get some dynamic css themes going
		el.html(this.template({
			gravatar: window.user.avatar()
		}));
		el.find('#prefs').css({
			position: 'absolute',
			width: 400,
			height: 170,
			'background-color': '#444',
			'z-index': 2,
			'margin-left': -200,
			left: '50%',
			top: 200
		});
		el.find('#title').css({
			'margin': 10,
			'color': 'white',
			'font-weight': 'bold',
			'font-size': 18
		});
		el.find('a').css({'color':'white'});
		el.find('#avatar').css({
			'margin': 10,
			'color': 'white'
		});
		el.find('img').css({
			'float': 'left',
			width: 32,
			height: 32,
			'margin-top': 12
		});
		el.find('input').css({
			'float': 'left',
			height: 32,
			width: 200,
			'margin-top': 12,
			'padding-left': 4
		});
		el.find('.button').css({
			'margin-left': 10
		});
		el.find('.small').css({
			'font-size': 10,
			color: 'white',
			'margin-left': 10,
			'margin-top': 5
		});
		el.find('#save').click(function(){
			var email = el.find('input').val();
			room.trigger('avatar', email);
			el.css('display','none');
		});
	}
});