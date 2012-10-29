var _u = require('underscore');
var db = require('./database.js');
var api = require('./api.js');
var utils = require('./sutils.js');
var names = require('./names.js');
var models = require('./models.js');
var Logger = require('./logger.js');

var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io').listen(http);
io.set('log level', 1);
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
roomlist.fetch({success: function(){
	var logger = new Logger({
		room: roomlist.at(0) });
}});
var userlist = new models.UserList();
userlist.fetch();

// todo -- any more than 20 requests per second is prob ddos

app.get('/', function(req, res){
	var room = roomlist.at(0);
	var user = new models.User();
	if (req.session.user_id)
		user = userlist.get(req.session.user_id)
	else userlist.add(user);
	req.session.user_id = user.id;
	res.render('room.jade', {
		room: JSON.stringify(room.json()),
		user: JSON.stringify(user.toJSON()),
		rules: room.get('rules')
	});
});

var api = new api.ConnectionApi({
	io: io, 
	store: session_store,
	userlist: userlist, 
	roomlist: roomlist
});


