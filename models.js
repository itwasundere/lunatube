var serverside = false;
if (typeof(require) != 'undefined')
	serverside = true;

// serverside code
if (serverside) {
	var db = require('./database.js');
	var now = require('./sutils').now;
	var Backbone = require('backbone');
	var crypto = require('crypto');
	var names = require('./names.js');
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
	db_fields: ['queue_id', 'prev', 'next', 'url', 'time'],
	defaults: {
		queue_id: 0,
		prev: 0,
		next: 0,
		url: '00000000000',
		time: 0,
		thumb: 'static/img/novid.png',
		title: 'Loading video...',
		uploader: '',
		time_text: '',
		watched: false
	},
	initialize: function() {
		this.classname = 'video';
		if (serverside && !this.id && this.get('hash')) {
			var md5 = crypto.createHash('md5');
			md5.update(''+Math.random());
			this.set('id',md5.digest('hex'));
		}
		if (!serverside && this.verify()) {
			this.fetch_yt();
		}
	},
	fetch_yt: function() {
		var url = this.get('url');
		var infourl = 'http://gdata.youtube.com/feeds/api/videos/'+url+'?v=2&alt=json&key=AI39si5Us3iYwmRdK0wa2Qf2P9eV-Z8tbjogUWw1B4JQUs191PgYNJChEKEooOq6ykQzhywLEBA9WxuKphpWUoCRA7S7jeLi5w';
		var self = this;
		$.get(infourl, function(data){
			var seconds = parseInt(data.entry.media$group.yt$duration.seconds);
			var minutes = Math.floor(seconds/60);
			var mod_seconds = seconds%60+'';
			if (mod_seconds.length != 2) mod_seconds = '0'+mod_seconds;
			
			self.set({
				title: data.entry.title.$t,
				uploader: data.entry.author[0].name.$t,
				time: seconds,
				thumb: data.entry.media$group.media$thumbnail[0].url,
				time_text: minutes+':'+mod_seconds
			});
		});
	},
	verify: function() {
		var url = this.get('url');
		// todo -- santify the url charset
		if (typeof(url) != 'string' || url.length != 11)
			return false;
		if (url == '00000000000') return false;
		return true;
	}
});

models.VideoList = Backbone.Collection.extend({
	model: models.Video,
	initialize: function() {
		var self = this;
		this.classname = 'video';
	},
	get_first: function(){
		var idle = new models.Video({ url: 'Bq6WULV78Cw' });
		return this.at(0) || idle;
	},
	after: function(video) {
		var current = this.get(video.id);
		if (!current) return this.at(0);
		var nextid = current.get('next');
		if (nextid) return this.get(nextid) || this.get_first();
		else return this.at(0) || this.get_first();
	},
	append: function(video_info) {
		var self = this;
		video_info = {
			url: video_info.url,
			time: video_info.time
		};
		if (this.id) {
			if (this.length == 0) {
				video_info.queue_id = this.id;
				var video = new models.Video(video_info);
				video.save({},{success:function(){
					self.add(video);
				}});
				return;
			}
			var prev = this.last();
			if (prev.id)
				video_info.prev = prev.id;
			video_info.queue_id = this.id;
			var video = new models.Video(video_info);
			video.save({},{success:function(){
				prev.save({next:video.id},{success:function(){
					self.add(video);
				}});
			}});
		}
		else {
			video_info.hash = true;
			var video = new models.Video(video_info);
			if (video.verify())
				this.add(video);
		}
	},
	insert: function(video_info, after) {
		video = new models.Video({ 
			hash: true, 
			url: video_info.url, 
			time: video_info.time 
		});
		if (!video.verify()) return;
		var after_id;
		if (after) after_id = after.id;
		var pos = this.indexOf(this.get(after_id));
		this.add(video, {at: pos+1});
	},
	kill: function(video) {
		var prev = this.get(video.get('prev'));
		var next = this.get(video.get('next'));
		if (prev) prev.set('next', video.get('next'));
		if (next) next.set('prev', video.get('prev'));
		if (prev) prev.save();
		if (next) next.save();
		video.destroy();
		this.remove(video);
	}
});

models.Player = Backbone.Model.extend({
	defaults: {
		state: 'paused',
		current: new models.Video(),
		prev: new models.Video(),
		time: 0
	},
	play: function(){
		this.set('state', 'playing');
		this.trigger('action');
	},
	pause: function(){
		this.set('state', 'paused');
		this.trigger('action');
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
		var self = this;
		if (this.get('state') == 'playing')
			time += 1;
		if (time <= this.get('current').get('time')) {
			this.set({'time': time}, {silent: true});
			return;
		} else {
			this.trigger('end');
		}
	},
	set_vid: function(video) {
		video.set({ watched: true });
		this.set({
			time: 0,
			current: video,
			state: 'playing'
		});
	},
	seek: function(time) {
		var vidlength = this.get('current').get('time');
		if (time < vidlength)
			this.set('time', time);
		else this.set('time', vidlength);
		this.trigger('action');
	}
});

models.Message = Backbone.Model.extend({
	defaults: {
		author: 0,
		content: '',
		time: 0,
		rendered: false
	},
	initialize: function() {
		if (!this.id) {
			var md5 = crypto.createHash('md5');
			md5.update(''+Math.random());
			this.set('id',md5.digest('hex'));
		}
		if (!this.get('time')) {
			this.set('time', (new Date()).getTime());
		}
	}
});

models.MessageList = Backbone.Collection.extend({
	model: models.Message
})

models.User = Backbone.Model.extend({
	defaults: {
		username: '', 
		avatar_url: '/static/avatars/newfoal.png'
	},
	initialize: function(){
		this.classname = 'user';
		if (this.get('blank')) {
			this.attributes = this.get('blank');
			return;
		}
		if (!this.id && serverside) {
			var md5 = crypto.createHash('md5');
			md5.update(''+Math.random());
			this.set('id',md5.digest('hex'));
		}
		if (!this.get('username') && serverside)
			this.set('username',names.gen_name());
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
		if (serverside)
			this.db_fetch();
		var self = this;
		var player = this.get('player');
		player.on('end', function(){
			player.set_vid(self.next_video());
		});
	},
	db_fetch: function() {
		var self = this;
		
		// modlist
		var modlist = new Backbone.Collection();
		modlist.classname = 'mod';
		modlist.query = 'room_id='+this.id;
		modlist.fetch();
		modlist.bind('reset', function(){
			modlist.each(function(modlink){
				// todo -- should i use userlist or make new user
				var user = new models.User({
					id: modlink.get('user_id')
				});
				user.fetch();
				self.get('modlist').add(user);
			});
		});

		// playlist
		var playlist = this.get('playlist');
		var player = this.get('player');
		playlist.on('reset', function(){
			if (player.get('current').get('time')) return;
			player.set_vid(playlist.get_first());
		});
		playlist.id = this.get('queue_id');
		playlist.query = 'queue_id='+playlist.id;
		playlist.fetch();

		// owner
		var owner = this.get('owner');
		owner.id = this.get('owner_id');
		owner.fetch();
	},
	next_video: function() {
		var curr = this.get('player').get('current');
		var newv = this.get('playlist').after(curr);
		var unwatched = this.get('queue').where({watched: false});
		if (unwatched.length)
			newv = unwatched[0];
		return newv;
	},
	message: function(user, content) {
		if (!this.get('userlist').get(user.id)) return;
		if (this.get('mutelist').get(user.id)) return;
		else {
			var messages = this.get('messages');
			if (messages.length >= 100)
				messages.reset();
			messages.add({
				author: user.id,
				content: content
			});
		}
	},
	join: function(user){
		this.get('userlist').add(user);
	},
	leave: function(user) {
		this.get('userlist').remove(user.id);
	},
	json: function() {
		var json = this.toJSON();
		json['messages'] = [];
		return json;
	}
});

models.RoomList = Backbone.Collection.extend({
	model: models.Room,
	initialize: function() {
		this.classname = 'room'
	}
});

models.SessionStore = Backbone.Model.extend({});

if (serverside) {
	module.exports = models;
}
