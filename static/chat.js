var ChatView = Backbone.View.extend({
	initialize: function() {
		var self = this;
		var messages = this.model.get('messages');
		messages.bind('add', function(){
			var unrendered = room.get('messages').where(
				{rendered: false});
			$.each(unrendered, function(idx, msg){
				self.message(msg);
				msg.set('rendered', true);
			});
		});
	},
	message: function(msg) {
		var log = this.$el.find('#messages');
		var mv = this.last_message_view;
		if (!mv || !mv.append(msg)) {
			var mv = new MessageView({
				model: msg });
			mv.render();
			log.append(mv.el);
			this.last_message_view = mv;
		}
	},
	render: function() {
		var room = this.model, el = this.$el, self = this;
		el.find('#mouth #avatar img').attr('src', window.user.get('avatar_url'));
		var input = el.find('#mouth #input input');
		input.keydown(function(event){
			if (event.keyCode != 13) return;
			var msg = new models.Message({
				author: window.user.id,
				content: input.val()
			});
			room.trigger('message', {
				msg: msg });
			input.val('');
		})
	}
})

var MessageView = Backbone.View.extend({
	initialize: function(){
		if (!this.model) return;
		var content = this.model.get('content');
		if (is_img_link(content)) {
			this.options.url = content;
			this.options.thumbnail = content;
			this.media = true;
		}
		else if (is_yt_link(content)) {
			var vidid = get_yt_vidid(content);
			this.options.video = new Video({
				url: vidid });
			this.options.url = 'http://youtube.com/watch?v='+vidid;
			this.options.thumbnail = get_yt_thumbnail(vidid);
			this.media = true;
		}
	},
	append: function(message){
		if (message.media) return false;
		if (message.get('author') != this.model.get('author'))
			return false;
		if (!this.options.appendum) this.options.appendum = [];
		this.options.appendum.push(message);
		this.render();
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