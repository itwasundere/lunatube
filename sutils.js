var crypto = require('crypto');

function hash() {
	var md5 = crypto.createHash('md5');
	md5.update(''+Math.random());
	return md5.digest('hex');
}

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

function cookie(params, days_exp) {
	var date = new Date();
    date.setTime(date.getTime()+(days_exp*24*60*60*1000));
    var expires = "; expires="+date.toGMTString();
    return dict_to_string(params)+expires+"; path=/";
}

var dict_to_string = function(params) {
	var statement = [];
	for (key in params) {
		var val = params[key];
		statement.push(key+'='+val);
	}
	return statement.join(';');
}

function now() {
	return Math.round((new Date()).getTime() / 1000);
}

module.exports = {
	hash: hash,
	cookie: cookie,
	purge: purge,
	now: now
};
