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
http.listen(process.env.VCAP_APP_PORT || 8080);

// express setup
app.locals.pretty = true;
app.set('views', __dirname + '/views');
app.use('/static', express.static(__dirname + '/static'));
app.use(express.cookieParser('jimmyrussels')); 
app.use(express.bodyParser());

// main room
var roomlist = new models.RoomList();
roomlist.fetch({success: function(){
	var logger = new Logger({
		room: roomlist.at(0) });
}});

// todo -- any more than 20 requests per second is prob ddos

var api = new api.ConnectionApi({
	io: io,
	sessions: new models.SessionStore(),
	userlist: new models.UserList(),
	roomlist: roomlist
});

app.get('/', function(req, res){
	var room = roomlist.at(0);
	var user = new models.User();
	var userlist = api.get('userlist');
	var sessions = api.get('sessions');
	var session = sessions.get(req.cookies.session);
	if (session && userlist.get(session.user_id))
		user = userlist.get(session.user_id);
	else {
		userlist.add(user);
		var md5 = utils.hash();
		res.cookie('session', md5);
		sessions.set(md5,{user_id: user.id});
	}
	res.render('room.jade', {
		room: JSON.stringify(room.json()),
		user: JSON.stringify(user.toJSON()),
		rules: room.get('rules')
	});
});


