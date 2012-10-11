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
