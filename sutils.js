var crypto = require('crypto');

var denied_ips = {};

function get_after(str, substr, len) {
	var loc = str.indexOf(substr);
	if (loc == -1) return;
	return str.substring(loc + substr.length, loc + substr.length + len);
}
function contains(str, substr) {
	return str.indexOf(substr) != -1;
}
function is_yt_link(str) {
	return contains(str, 'youtube.com') && contains(str, 'v=');
}

function get_yt_vidid(str) {
	if (!is_yt_link(str)) return '';
	return get_after(str, 'v=', 11);
}

function deny_ip(ip) {
	if (denied_ips[ip])
		return true;
	denied_ips[ip] = true;
	setInterval(function(){ 
		denied_ips[ip] = false; }, 1000);
	return false;
}

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
	now: now,
	deny_ip: deny_ip,
	get_yt_vidid: get_yt_vidid
};
