var plapi = 'https://gdata.youtube.com/feeds/api/playlists/';
var plapi2 = '?v=2&alt=json&key=AI39si5Us3iYwmRdK0wa2Qf2P9eV-Z8tbjogUWw1B4JQUs191PgYNJChEKEooOq6ykQzhywLEBA9WxuKphpWUoCRA7S7jeLi5w';
var CatalogView = Backbone.View.extend({
	initialize: function() {
		var el = this.$el, self = this;
		this.subviews = {};
		$.each(this.options.playlists, function(name, list){
			el.find('.section#'+name).click(function(){
				self.show(name);
			});
		});
		room.get('player').bind('change:current',this.show_current, this);
		el.find('#import').hover(function(){
			var drop = $('<div id="dropdown">\
					<input type="text" id="input" placeholder="Youtube Playlist URL"/>\
				</div>');
			$(this).append(drop);
		},function(){
			$(this).find('#dropdown').remove();
		});
		el.find('#import #btn').click(function(){
			var url = el.find('#import input').val();
			if (!url) return;
			var plid = get_yt_plid(url);
			if (!plid || !plid.length) return;
			$.get(plapi+plid+plapi2, function(response){
				if (!response || !response.feed || !response.feed.entry || !response.feed.entry.length) return;
				$.each(response.feed.entry, function(idx, entry){
					var video = new models.Video({
						url: get_yt_vidid(entry.link[0].href),
						ready: function() {
							window.room.trigger('playlist', video);
						}
					});
				});
			});
		});
		el.find('#add').hover(function(){
			var drop = $('<div id="dropdown">\
					<input type="text" id="input" placeholder="Youtube Video URL"/>\
				</div>');
			$(this).append(drop);
		},function(){
			$(this).find('#dropdown').remove();
		});
		el.find('#add #btn').click(function(){
			var url = get_yt_vidid(el.find('#add input').val());
			if (!url) return;
			var video = new models.Video({
				url: url,
				ready: function() {
					window.room.trigger('playlist', video);
				}
			});
		});
		el.find('#clear').click(function(){
			window.room.trigger('clear',self.showing);
		});
	},
	render: function() {
		var el = this.$el.find('#videos').empty(), self = this;
		if (!ismod(window.user)) this.$el.find('#headers #right').css('visibility','hidden');
		$.each(this.options.playlists, function(name, list){
			var sel = $('<div>');
			var cel = self.$el.find('.section#'+name+' #count');
			el.append(sel);
			self.subviews[name] = new PlaylistView({
				model: list, el: sel, cel: cel });
			self.subviews[name].render();
		});	
		this.show_current();
	},
	show: function(name) {
		this.showing = name;
		$.each(this.subviews, function(svn, sv){
			if (svn == name)
				sv.$el.css('display','block');
			else sv.$el.css('display','none');
		});
		this.$el.find('.section.selected').removeClass('selected');
		this.$el.find('.section#'+name).addClass('selected');
	},
	show_current: function() {
		var self = this;
		$.each(this.options.playlists, function(name, list){
			var current = room.get('player').get('current');
			if (list.get(current.id))
				self.show(name);
		});
	}
});

var PlaylistView = Backbone.View.extend({
	initialize: function() {
		this.model.bind('add remove reset', this.render, this);
		room.get('player').bind('change:current', this.render_current, this);
		this.subviews = {};
	},
	render: function() {
		var self = this, el = this.$el.empty();
		this.options.cel.html('('+this.model.length+')');
		this.model.each(function(item){
			var piv = self.subviews[item.id];
			if (!piv) {
				piv = new PlaylistItemView({
					model: item, removable: true
				});
				self.subviews[item.id] = piv;
			}
			el.append(piv.el);
			piv.render();
		});
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
		if (!this.model) return;
		this.model.bind('change', this.render, this);
		this.template = _.template($('script#video').html());
		var el = this.$el, self = this;
	},
	render: function() {
		var el = this.$el, self = this;
		if (!this.model) return;
		var html = $(this.template(this.model.toJSON()));
		el.html(html.html());
		if (this.options.removable) {
			el.find('#thumbnail, #info').click(function(event){
				room.trigger('play', self.model);
				return;
			});
			el.hover(function(){
				el.find('#actions').css('display','block');
			}, function(){
				el.find('#actions').css('display','none');
			});
			el.find('#open').click(function(){
				var str = 'http://youtube.com/watch?v='+self.model.get('url');
				window.open(str,'_blank');
			});
			if (!ismod(window.user)) el.find('#delete').css('display','none');
			el.find('#delete').click(function(){
				window.room.trigger('delete', self.model);
			});
		}
		el.attr('id', html.attr('id'))
	}
});