var crypto = require('crypto');

function hash() {
	var md5 = crypto.createHash('md5');
	md5.update(''+Math.random());
	return md5.digest('hex');
}

function purge(str, length) {
	return str.substr(0, length);
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
