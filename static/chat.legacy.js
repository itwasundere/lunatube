
window.Message = Backbone.Model.extend({
	defaults: {
		content: '',
		date: 0,
		user: new User()
	},
	initialize: function() {
		var content = this.get('content');
		if (is_img_link(content))
			this.set('type', 'image');
		else if(is_yt_link(content)) {
			this.set('type', 'youtube');
			var vidid = get_yt_vidid(content);
			var video = new Video({ url: vidid });
			this.set('video', video);
			var info_url = _.template(globals.vidinfo, {videoid: vidid});
			$.get(info_url, function(data){
				var totalsecs = parseInt(data.entry.media$group.yt$duration.seconds);
				video.set({
					title: data.entry.title.$t,
					uploader: data.entry.author[0].name.$t,
					minutes: Math.floor(totalsecs/60),
					seconds: totalsecs%60,
					thumb: data.entry.media$group.media$thumbnail[0].url
				});
			});
			return;
		}
		this.set('type', 'text');
	},
	bind_clicks: function(serv) {
		/*
		var self = this;
		this.bind('play_now', function(){
			serv.emit('video', { video: self.get('video').toJSON() });
		});
		this.bind('play_next', function(){
			serv.emit('playlist', { insert: self.get('video').toJSON()});
		});
		this.bind('play_last', function(){
			serv.emit('playlist', { append: self.get('video').toJSON() });
		});
		this.bind('bookmark', function(){
			serv.emit('bookmark', { video: self.get('video').toJSON() });
		});*/
	}
});

window.MessageList = Backbone.Collection.extend({
	model: Message
});

window.Chat = Backbone.Model.extend({
	defaults: {
		members: new UserList(),
		messages: new MessageList(),
		server: window.server,
		me: window.me,
		last_joined: new User(),
		last_left: new User()
	},
	initialize: function() {
		var self = this;
		/*
		var serv = this.get('server');
		serv.on('members', function(data){
			data = _.map(data, function(obj){ return obj.attr });
			self.set('members',new UserList(data));
		});
		serv.on('message', function(data){
			var msg = new Message({ content: data.content });
			if (data.user_id)
				msg.set('user', self.get('members').get(data.user_id));
			self.get('messages').add(msg);
			msg.bind_clicks(serv);
			self.trigger('message');
		});
		serv.emit('chat', { 
			action: 'join'
		});
		serv.on('joined', function(data){
			self.set('last_joined', new User(data.attr));
			self.trigger('joined');
		});
		serv.on('left', function(data){
			self.set('last_left', new User(data.attr))
			self.trigger('left');
		});*/
	},
	send: function(message) {
		/*this.get('server').emit('message',{
			content: message
		});*/
	}
});

window.MessageView = Backbone.View.extend({
	initialize: function() {
		this.message_text_template = _.template($('script#message_text').html());
		this.message_img_template = _.template($('script#message_img').html());
		this.message_yt_template = _.template($('script#message_yt').html());
		if (this.model.get('type') == 'youtube')
			this.model.get('video').bind('change', this.render, this);
	},
	render: function() {
		var self = this;
		
		var content = this.model.get('content');
		var user = this.model.get('user');
		var template = this.message_text_template;
		var template_info = {
			username: user.get('username'),
			avatar: user.get('avatar_url'),
			id: user.get('id'),
			content: content
		}
		
		switch(this.model.get('type')) {
			case 'image': 
				template = this.message_img_template;
				template_info.thumb = content;
				template_info.url = content;
				break;
			case 'youtube':
				var video = this.model.get('video');
				template = this.message_yt_template;
				template_info = _.extend(template_info,{
					url: video.url(),
					thumb: video.get('thumb'),
					title: video.get('title'),
					artist: video.get('uploader'),
					time: video.get('time')
				});
				break;
			case 'text': break;
		}

		this.$el.html(template(template_info));

		if (this.model.get('type') == 'youtube')
			this.bind_clicks();
	},
	bind_clicks: function() {
		var self = this;
		this.$el.find('#play').click(function(){
			self.model.trigger('play_now'); });
		this.$el.find('#play_next').click(function(){
			self.model.trigger('play_next'); });
		this.$el.find('#add_queue').click(function(){
			self.model.trigger('play_last'); });
		this.$el.find('#bookmark').click(function(){
			self.model.trigger('bookmark'); });
	}
})

window.ChatView = Backbone.View.extend({
	initialize: function() {
		var self = this;
		this.model.bind('message', this.render_log, this);
		this.model.bind('joined', this.joined, this);
		this.model.bind('left', this.left, this);
	},
	render: function() {
		var self = this;
		var self_avatar = this.$el.find('#chatinput_top .avatar');
		self_avatar.html('<img src="'+this.model.get('me').get('avatar_url')+'">');
		var input = this.$el.find('input#chatinput');
		this.model.get('messages').each(function(message){
			message.rendered = false;
		});
		input.keyup(function(event){
			if (event.keyCode == '13') {
				self.model.send(input.val());
				input.val('');
			}
		});
		this.render_log();
	},
	render_log: function(message) {
		var log = this.$el.find('#chatlog_text');
		this.model.get('messages').each(function(message){
			if (message.rendered) return;
			var mv = new MessageView({ model: message });
			message.rendered = true;
			log.append(mv.el);
			mv.render();
		});
	},
	joined: function() {
		var log = this.$el.find('#chatlog_text');
		var message = new Message({
			user: this.model.get('last_joined'),
			content: 'has joined the conversation'
		});
		var mv = new MessageView({ model: message });
		message.rendered = true;
		log.append(mv.el);
		mv.render();
	},
	left: function() {
		var log = this.$el.find('#chatlog_text');
		var message = new Message({
			user: this.model.get('last_left'),
			content: 'has left the conversation'
		});
		var mv = new MessageView({ model: message });
		message.rendered = true;
		log.append(mv.el);
		mv.render();
	}
})
