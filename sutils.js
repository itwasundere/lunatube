var crypto = require('crypto');

function hash() {
	var md5 = crypto.createHash('md5');
	md5.update(''+Math.random());
	return md5.digest('hex');
}

var valid = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890 _';
function deep_purge(a, len) {
	var str = '';
	for(c in a) {
		if (valid.indexOf(a[c])>-1)
			str += a[c];
		if (c > len) return;
	}
	return str;
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
	deep_purge: deep_purge,
	purge: purge,
	now: now
};
