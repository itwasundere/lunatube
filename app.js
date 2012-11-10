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
// var io = require('socket.io').listen(http);

http.listen(80);

// express setup
app.locals.pretty = true;
app.set('views', __dirname + '/views');
app.use(express.staticCache());
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

// var api = new api.ConnectionApi({
// 	io: io,
// 	sessions: new models.SessionStore(),
// 	userlist: new models.UserList(),
// 	roomlist: roomlist
// });

var ips = {}

app.get('/', function(req, res){
	// var ip = req.connection.remoteAddress;
	// if (!ips[ip])
	// 	ips[ip] = {};
	// if(ips[ip].timing) return;
	// else {
	// 	ips[ip].timing = true;
	// 	setInterval(function(){ ips[ip].timing = false; }, 1000);
	// }

	res.send('please visit livestream.com/nirvashderpy or justin.tv/haxmega');
	res.end();
	return;

	/*
	if (!ips[ip]) {
		var geoip = 'api.hostip.info';
		var path = '/get_json.php?ip='+ip;
		require('http').get({host: geoip, path: path}, function(res){
			var str = '';
			res.on('data', function(chunk){
				str += chunk;
			});
			res.on('end', function(){
				var city = JSON.parse(str).city;
				ips[ip] = city;
			});
		}, function(){});
	} else if (ips[ip] == 'San Ramon, CA' || ips[ip] == 'San Jose, CA' || ips[ip] == 'Sunnyvale, CA') return;
	*/
	// var room = roomlist.at(0);
	// if (room.get('userlist').length > 150 && ip!='67.164.89.50') {
	// 	res.render('sorry.jade',{});
	// 	return;
	// }
	// var user = new models.User();
	// var userlist = api.get('userlist');
	// var sessions = api.get('sessions');
	// var session = sessions.get(req.cookies.session);
	// if (session && userlist.get(session.user_id))
	// 	user = userlist.get(session.user_id);
	// else {
	// 	userlist.add(user);
	// 	var md5 = utils.hash();
	// 	res.cookie('session', md5);
	// 	sessions.set(md5,{user_id: user.id});
	// }
	// res.render('room.jade', {
	// 	room: JSON.stringify(room.json()),
	// 	user: JSON.stringify(user.toJSON()),
	// 	rules: room.get('rules')
	// });
});


