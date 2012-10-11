window.User = Backbone.Model.extend({
	defaults: {
		id: 0,
		username: '',
		avatar_url: '',
	}
});
window.UserList = Backbone.Collection.extend({
	model: User
});
