var cookiep = require('cookie');

function purge(str) {
	var ret = '';
	for (var c=0;c<str.length;c++) {
		var ch = str.charCodeAt(c);
		if ((ch>=65 && ch<=90) ||
			(ch>=97 && ch<=122) ||
			(ch>=48 && ch<=57))
			ret += str[c];
		if (ret.length >= 32) return ret;
	}
	return ret;
}

function get_session(session_store, cookie, callback) {
	var parsed_cookies = cookiep.parse(cookie);
	var connect_sid = parsed_cookies['connect.sid'];
	if (connect_sid) {
		var s = connect_sid.indexOf(':')+1;
		var e = connect_sid.indexOf('.')-2;
		connect_sid = connect_sid.substr(s,e);
		session_store.get(connect_sid, function(error, session){
			callback(session);
		});
	}
}

function now() {
	return Math.round((new Date()).getTime() / 1000);
}

module.exports = {
	purge: purge,
	get_session: get_session,
	now: now
};
