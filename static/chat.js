var MessageView = Backbone.View.extend({
	initialize: function(){
		if (!this.model) return;
		var content = this.model.get('content');
		if (is_img_link(content)) {
			this.options.url = content;
			this.options.thumbnail = content;
			this.text = false;
		}
		else if (is_yt_link(content)) {
			var vidid = get_yt_vidid(content);
			this.options.video = new Video({
				url: vidid });
			this.options.url = 'http://youtube.com/watch?v='+vidid;
			this.options.thumbnail = get_yt_thumbnail(vidid);
			this.text = false;
		}
	},
	append: function(message){
		if (!message.text) return false;
		if (message.get('author') != this.model.get('author'))
			return false;
		if (!this.options.appendum) this.options.appendum = [];
		this.options.appendum.push(message);
		return true;
	},
	render: function(){
		var content = make_links(this.model.get('content'));
		if (this.options.thumbnail)
			content = '<img src="'+this.options.thumbnail+'" />';
		if (this.options.url)
			content = '<a href="'+this.options.url+'">'+content+'</a>';
		if (this.options.appendum)
			$.each(this.options.appendum, function(idx, msg){
				content += '<br/>'+msg.get('content');
			});
		var el = this.$el, self = this;
		var avatar = '', username = '';
		if (window.room) {
			var user = room.get('userlist').get(this.model.get('author'));
			if (user) {
				avatar = user.get('avatar_url');
				username = user.get('username');
			}
		}
		el.html(_.template($('script#message').html(),{
			avatar: avatar,
			username: username,
			content: content
		}));
	}
})