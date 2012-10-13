var serverside = false;
if (typeof(require) != 'undefined')
	serverside = true;

// serverside code
if (serverside) {
	var db = require('./database.js');
	var now = require('./sutils').now;
	var Backbone = require('backbone');
	Backbone.sync = function(method, model, options){
		switch(method) {
			case 'create': db.create(model, options); break;
			case 'read': 
				if (model.attributes)
					db.read(model, options);
				else db.read_all(model, options);
				break;
			case 'update': db.update(model, options); break;
			case 'delete': db.delete(model, options); break;
		}
	}
}

var models = {};

models.Video = Backbone.Model.extend({
	defaults: {
		queue_id: 0,
		prev: 0,
		next: 0,
		url: '00000000000',
		time: 0
	},
	initialize: function() {
		this.classname = 'video';
		if (!serverside && this.get('url') != '00000000000') {
			var url = this.get('url');
			var infourl = 'http://gdata.youtube.com/feeds/api/videos/'+url+'?v=2&alt=json';
			var self = this;
			$.get(infourl, function(data){
				var seconds = parseInt(data.entry.media$group.yt$duration.seconds);
				var minutes = Math.floor(seconds/60);
				var seconds = seconds%60;
				self.set({
					title: data.entry.title.$t,
					uploader: data.entry.author[0].name.$t,
					seconds: seconds,
					thumb: data.entry.media$group.media$thumbnail[0].url,
					time_text: minutes+':'+seconds
				});
			});
		}
	}
});

models.VideoList = Backbone.Collection.extend({
	model: models.Video,
	initialize: function() {
		var self = this;
		this.classname = 'video';
		this.bind('reset', function(){
			self.goto_first();
		});
	},
	goto_first: function() {
		var noprev = this.filter(function(vid){
			return !vid.get('prev'); });
		if (noprev.length > 0) {
			this.playhead = noprev[0],
			this.place = 0;
		}
	},
	advance: function() {
		var nextid = this.playhead.get('next');
		if (nextid)
			this.playhead = this.get(nextid)
		else this.goto_first();
	},
	back: function() {
		var previd = this.playhead.get('prev');
		if (previd)
			this.playhead = this.get(previd)
		else this.goto_first();
	},
	skip: function(video) {
		video = this.get(video.id);
		if (!video) return;
		this.playhead = video;
	},
	move: function(video, before, after) {

	}
});

models.Player = Backbone.Model.extend({
	defaults: {
		state: 'paused',
		current: new models.Video(),
		time: 0
	},
	play: function(){
		this.set('state', 'playing');
	},
	pause: function(){
		this.set('state', 'paused');
	},
	initialize: function() {
		var self = this;
		this.start_ticker();
	},
	start_ticker: function() {
		var self = this;
		setInterval(function(){ self.tick(); }, 1000);
	},
	tick: function() {
		if (!this.get('current')) return;
		var time = this.get('time');
		if (this.get('state') == 'playing')
			time += 1;
		if (time <= this.get('current').get('time')) {
			this.set({'time': time}, {silent: true});
			return;
		} else {
			this.pause();
			this.trigger('end');
		}
	},
	set_vid: function(video) {
		this.set('current', video);
		this.set('time',0);
		this.play();
	},
	seek: function(time) {
		var vidlength = this.get('current').get('time');
		if (time < vidlength)
			this.set('time', time);
		else this.set('time', vidlength);
	}
});

models.Message = Backbone.Model.extend({
	defaults: {
		author: 0,
		content: '',
		time: 0,
		sent: false,
		relayed: false,
		hash: ''
	}
});

models.MessageList = Backbone.Collection.extend({
	model: models.Message
})

models.User = Backbone.Model.extend({
	defaults: {
		username: '', 
		avatar_url: ''
	},
	initialize: function(){
		this.classname = 'user';
	}
});

models.UserList = Backbone.Collection.extend({
	model: models.User,
	initialize: function() {
		this.classname = 'user';
	}
});

models.Room = Backbone.Model.extend({
	defaults: {
		userlist: new models.UserList(),
		queue: new models.VideoList(),
		playlist: new models.VideoList(),
		player: new models.Player(),
		mutelist: new models.UserList(),
		modlist: new models.UserList(),
		owner: new models.User,
		messages: new models.MessageList()
	},
	initialize: function() {
		this.classname = 'room';
		var self = this;
		var count = 0;
		this.bind('change', function(){
			self.update();
		});

		var player = this.get('player');
		var playlist = this.get('playlist');
		playlist.on('reset', function(){
			player.set_vid(playlist.playhead);
		});
		player.on('end', function(){
			playlist.advance();
			player.set_vid(playlist.playhead);
		});
		this.update();
	},
	update: function() {
		var self = this;
		if (serverside) {
			self.get('playlist').query = 'queue_id='+this.get('queue_id');
			self.get('playlist').fetch();
			self.get('owner').id = this.get('owner_id');
			self.get('owner').fetch();
		}
	},
	join: function(user){
		this.get('userlist').add(user);
	},
	leave: function(user) {
		this.get('userlist').remove(user);
	},
	message: function(user, messages) {
		if (this.get('mutelist').get(user.id)) return;
		else this.get('messages').add(messages);
	},
	mute: function(mod, user, mute) {
		if (!this.get('modlist').get(mod.id)) return;
		if (!this.get('userlist').get(user.id)) return;
		if (mute)
			this.get('mutelist').add(user);
		else this.get('mutelist').remove(user);
	},
	mod: function(admin, user, mod) {
		if (this.get('owner').id != admin.id) return;
		if (!this.get('userlist').get(user.id)) return;
		if (mod)
			this.get('modlist').add(user);
		else this.get('modlist').remove(user);
	}
});

models.RoomList = Backbone.Collection.extend({
	model: models.Room,
	initialize: function() {
		this.classname = 'room'
	}
});

if (serverside) {
	module.exports = models;
}
