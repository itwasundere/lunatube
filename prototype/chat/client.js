window.WebSocket = window.WebSocket || window.MozWebSocket;
var conn = new WebSocket('ws://127.0.0.1:1337');
conn.onopen = function() {
	console.log('connected');
}
conn.onerror = function(error) {
	console.log('error');
};
conn.onmessage = function(message) {
	console.log(message.data);
}
