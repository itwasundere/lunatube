var db = require('./database.js');
var now = require('./sutils').now;
var Backbone = require('backbone');
var models = {};

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
	}
});

models.VideoList = Backbone.Collection.extend({
	model: models.Video,
	initialize: function() {
		this.classname = 'video';
		this.first();
	},
	first: function() {
		var noprev = this.filter(function(vid){
			return !vid.get('prev'); });
		if (noprev.length > 0) {
			this.playhead = noprev.first(),
			this.place = 0;
		}
	},
	advance: function() {
		var nextid = this.playhead.get('next');
		if (nextid)
			this.playhead = this.get(nextid)
		else this.first();
	},
	back: function() {
		var previd = this.playhead.get('prev');
		if (previd)
			this.playhead = this.get(previd)
		else this.first();
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
		state: 'playing',
		current: new models.Video(),
		playlist: new models.VideoList(),
		time: 0
	},
	play: function(){
		this.get('state', 'playing');
	},
	pause: function(){
		this.get('state', 'paused');
	},
	start_ticker: function() {
		var self = this;
		setInterval(function(){ self.tick(); }, 1000);
	},
	tick: function() {
		var time = this.get('time')
		if (this.get('state') == 'playing')
			time += 1;
		if (time <= this.get('current').get('time')) {
			this.set('time', time);
			return;
		} else this.next();
	},
	switch: function(playlist) {
		this.set('playlist', playlist);
	},
	skip: function(video) {
		var playlist = this.get('playlist');
		playlist.skip(video);
		if (playlist.playhead) {
			this.set('current', playlist.playhead);
			this.set('time',0)
		}
	},
	prev: function() {
		var playlist = this.get('playlist');
		playlist.back();
		if (playlist.playhead) {
			this.set('current', playlist.playhead);
			this.set('time', 0);
		}
	},
	next: function() {
		var playlist = this.get('playlist');
		playlist.advance();
		if (playlist.playhead)
			this.set('current', playlist.playhead);
		this.set('time', 0);
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
		pushed: false
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
		this.update();
	},
	update: function() {
		var self = this;
		self.get('playlist').query = 'queue_id='+this.get('queue_id');
		self.get('playlist').fetch();
		self.get('owner').id = this.get('owner_id');
		self.get('owner').fetch();
	},
	join: function(user){
		this.get('userlist').add(user);
	},
	leave: function(user) {
		this.get('userlist').remove(user);
	},
	message: function(user, message) {
		if (mutelist.get(user.id)) return;
		else this.get('message').append(message);
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

module.exports = models;

/*
models.Room = Backbone.Model.extend({
	initialize: function(io) {
		var room = this;
		this.queue = new dblib.queue(room.attr.queue_id);
		var first = this.queue.first(function(){
			room.start_emit(first, io); });
	},
	start_emit: function(first_vid, io) {
		var self = this;
		this.state = 1;
		this.startTime = now();
		this.currentVid = first_vid;
		this.first = first_vid;
		this.seekTime = 0;
		setInterval(function(){
			var cont = self.update_state();
			if (cont) self.emit_state(io);
		}, 1000);
	},
	update_state: function() {
		// update the time
		if (this.state == 1)
			this.vidTime = now() - this.startTime + this.seekTime;
		else {
			this.seekTime = this.vidTime;
			this.startTime = now();
		}
		
		// if at end of queue, start over
		if (!this.currentVid) {
			this.startTime = now();
			this.seekTime = 0;
			this.currentVid = this.first;
			return false;
		}
		
		// if past vid length, go on to next video
		if (this.vidTime > this.currentVid.attr.time) {
			this.startTime = now();
			this.seekTime = 0;
			this.currentVid = this.currentVid.next();
			return false;
		}

		return true;
	},
	seek: function(time, io) {
		this.startTime = now();
		this.seekTime = time;
		this.update_state();
		this.emit_state(io);
	},
	set_state: function(state, io) {
		this.state = state;
		this.update_state();
		this.emit_state(io);
	},
	emit_state: function(io) {
		var message = {
			playback: {
				video: this.currentVid.attr,
				time: this.vidTime,
				state: this.state
			}
		}
		io.sockets.in(this.id).emit('video', message);
	},
	load_video: function(vidid, io) {
		var video = new dblib.video();
		// todo: fix time here
		video.attr = {
			prev: this.currentVid.id, 
			next: this.currentVid.id, 
			queue_id: 0, 
			url: vidid, 
			time: 10 
		};
		this.currentVid = video;
		this.startTime = now();
		this.seekTime = 0;
		this.update_state();
		this.emit_state(io);
	}
});

models.Queue = Backbone.Model.extend({
	first: function(callback) {
		var video = new dblib.video();
		video.attr = {prev: 0, queue_id: this.id};
		video.find(callback);
		return video;
	},
	last: function(callback) {
		var video = new dblib.video();
		video.attr = {next: 0, queue_id: this.id};
		video.find(callback);
		return video;
	},
	append: function(vidid, io){
		
	}
});

models.Video = Backbone.Model.extend({
	next: function(callback) {
		if (this.attr.next == 0) return null;
		var video = new dblib.video(this.attr.next);
		video.read(callback);
		return video;	
	},
	prev: function(callback) {
		if (this.attr.prev == 0) return null;
		var video = new dblib.video(this.attr.prev);
		video.read(callback);
		return video;
	},
	insert: function(vidid, io){
		if (!this.id) {
			this.next().insert(vidid, io);
		}
	}
});
*/