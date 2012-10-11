var http = require('http');
var websocket = require('websocket').server;

var server = http.createServer(function(req, res){

});
server.listen(1337, function(){});

sock = new websocket({
	httpServer: server
});

sock.on('request', function(request){
	var conn = request.accept(null, request.origin);
	console.log('come');
	conn.on('message', function(message){
		if (message.type === 'utf8') {
			console.log(message);
			conn.sendUTF(message.utf8Data);
		}
	});
	conn.on('close', function(conn){
		console.log('gone');
	})
});

console.log('server running...');