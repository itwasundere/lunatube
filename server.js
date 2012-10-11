var _u = require('underscore');
var db = require('./database.js');
var api = require('./api.js');
var utils = require('./sutils.js');
var names = require('./names.js');
var models = require('./models.js');

var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io').listen(http);
http.listen(8080);

var session_store = new express.session.MemoryStore();

// express setup
app.locals.pretty = true;
app.set('views', __dirname + '/views');
app.use('/static', express.static(__dirname + '/static'));
app.use(express.cookieParser()); 
app.use(express.bodyParser());
app.use(express.session({
	secret: 'jimmyrussles', 
	cookie: { maxAge: 604800 },
	store: session_store
}));

// main room
var roomlist = new models.RoomList();
roomlist.fetch();
roomlist.each(function(room){ room.initialize(); });
var userlist = new models.UserList();
userlist.fetch();

app.get('/', function(req, res){
	var room = roomlist.at(0);
	req.session.room_id = room.id;
	if (!req.session.user)
		req.session.user = new models.User({
			username: names.gen_name() });
	res.render('room.jade', {
		room: JSON.stringify(room.toJSON()),
		user: JSON.stringify(req.session.user)
	});
	room.fetch();
});

var api = new api.ConnectionApi({
	io: io, store: session_store,
	userlist: userlist, roomlist: roomlist
});


/*
app.get('/', function(req, res){
	var room = roomlist.get(1);
	var queue, videos;
	room.read(function(){
		queue = new db.queue(room.attr.queue_id);
		videos = queue.associate('video','queue_id', function(){
			videos = _u.map(videos, function(video){ return video.json() });
			req.session.room = room;
			if (!req.session.user) {
				req.session.user = new db.user();
				req.session.user.attr.username = gen_name();
			}
			res.render('room.jade', {
				room: JSON.stringify(req.session.room.json()),
				videos: JSON.stringify(videos),
				user: JSON.stringify(req.session.user || null)
			});
		});
	});
});

// login and out
app.post('/login', function(req, res){
	var username = purge(req.body.username);
	var password = purge(req.body.password);
	var user = new db.user();
	user.attr.username = username;
	user.find(function(){
		if (user.id) {
			console.log('user found for '+username);
			if (user.attr.password == password) {
				console.log('correct password');
				req.session.user = user;
				res.send(JSON.stringify(user));
			}
			else {
				req.session.user = new db.user();
				req.session.user.attr.username = gen_name();
				res.send(JSON.stringify(user));
			}
		}
		else {
			console.log('new user '+username);
			user.attr.password = password;
			user.save(function(){
				req.session.user = user;
				res.send(JSON.stringify(user));
			});
		}
	});
});
*/
