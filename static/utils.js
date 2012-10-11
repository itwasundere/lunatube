_.templateSettings = { interpolate: /\[\[(.+?)\]\]/g };

window.verify_vidid = function(vidid){
	if (vidid && vidid.length == 11)
		return true;
	return false;
},

window.globals = {}
function add_globals(global) {
	window.globals = _.extend(globals, global); }

function ends_with(str, ends) {
	if (typeof ends == 'string')
		return str.substr(str.length - ends.length, str.length) == ends;
	else {
		var toreturn = false;
		for(idx in ends) {
			word = ends[idx];
			toreturn |= str.substr(str.length - word.length, str.length) == word;
		}
		return toreturn;
	}
}
function starts_with(str, starts) {
	if (typeof starts == 'string')
		return str.substr(0, starts.length) == starts;
	else {
		var toreturn = false;
		for(idx in starts) {
			word = starts[idx];
			toreturn |= str.substr(0, word.length) == word;
		}
		return toreturn;
	}
}
function contains(str, substr) {
	return str.indexOf(substr) != -1;
}
function get_after(str, substr, len) {
	var loc = str.indexOf(substr);
	if (loc == -1) return;
	return str.substring(loc + substr.length, loc + substr.length + len);
}
function is_img_link(str) {
	if (contains(str, ' '))
		return false;
	if (contains(str, 'imgur.com') && ends_with(str,['.jpg','.png','.gif']))
		return true;
	return false;
}
function is_yt_link(str) {
	return contains(str, 'youtube.com') && contains(str, 'v=');
}
function get_yt_vidid(str) {
	if (!is_yt_link(str)) return '';
	return get_after(str, 'v=', 11);
}
function get_yt_thumbnail(vidid) {
	return 'http://img.youtube.com/vi/'+vidid+'/2.jpg';
}
