var http = require('http');
var websocket = require('websocket').server;

var server = http.createServer(function(req, res){

});
server.listen(8081, function(){});

sock = new websocket({
	httpServer: server
});

clients = {};

sock.on('request', function(request){
	var conn = request.accept(null, request.origin);
	console.log('come');
	clients[conn.remoteAddress] = conn;
	conn.on('message', function(message){
		if (message.type === 'utf8') {
			console.log(message);
			for (ip in clients)
				clients[ip].sendUTF(message.utf8Data);
		}
	});
	conn.on('close', function(conn){
		console.log('gone');

	});
});

console.log('player server running on port 8081');