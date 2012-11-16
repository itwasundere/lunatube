var fs = require("fs");
var less = require('less');
var _u = require('underscore');

var api = require('./api.js');
var utils = require('./sutils.js');
var names = require('./names.js');
var models = require('./models.js');
var Logger = require('./logger.js');
	
var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io').listen(http);
io.set('log level', 0);
io.set('transports', ['xhr-polling']);

var port = 8080;
http.listen(port);
console.log("server listening on port %d in %s mode", http.address().port, app.settings.env);

// express setup
app.locals.pretty = true;
app.set('views', __dirname + '/views');
app.use('/static', express.static(__dirname + '/static'));
app.use(express.cookieParser('jimmyrussels')); 
app.use(express.bodyParser());


var main = function() {
	var room = roomlist.at(0);
	var logger = new Logger({room: room});
	var connections = new api.ConnectionApi({
		io: io,
		sessions: new models.SessionStore(),
		userlist: new models.UserList(),
		roomlist: roomlist
	});
	var userlist = connections.get('userlist');
	var sessions = connections.get('sessions');

	app.get('/', function(req, res){
		if (utils.deny_ip[req.connection.remoteAddress]) return;
		var session = sessions.get(req.cookies.session);
		var user;
		if (session && userlist.get(session.user_id))
			user = userlist.get(session.user_id)
		else {
			user = new models.User();
			userlist.add(user);
			var md5 = utils.hash();
			sessions.set(md5, {
				user_id: user.id,
				room_id: room.id
			});
			res.cookie('session', md5);
		}
		res.render('room.jade', { 
			room: room.json(),
			user: user.toJSON(),
			production: app.settings.env == 'production'
		});
	});
};

var roomlist = new models.RoomList();
roomlist.fetch({success: main});
