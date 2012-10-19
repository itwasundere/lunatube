var Underscore = require('underscore');
var sqlite3 = require('sqlite3').verbose();

var sql = {
	table: function(name, cols) {
		var pre = 'create table if not exists '+name;
		var strs = ['id integer primary key autoincrement'];
		for (colname in cols)
			strs.push(colname+' '+cols[colname]);
		return 'create table if not exists '+name+' ('+strs.join(', ')+')';
	},
	get: function(name, id) {
		return 'select * from '+name+' where id = '+id;
	},
	all: function(name) {
		return 'select * from '+name;
	},
	select: function(name, params) {
		if (params)
			return 'select * from '+name+' where '+params;
		else return 'select * from '+name;
	},
	update: function(name, id, params) {
		var set = [];
		for (param in params) {
			if (param == 'id') continue;
			var value = params[param];
			set.push(param+'="'+value+'"');
		}
		return 'update '+name+' set '+set.join(', ')+' where id='+id;
	},
	insert: function(name, params) {
		var colnames = [];
		var values = [];
		for (param in params) {
			if (param == 'id') continue;
			colnames.push(param);
			values.push('"'+params[param]+'"');
		}
		return 'insert into '+name+' ('+colnames.join(', ')+') values ('+values.join(',')+')';
	},
	delete: function(name, id) {
		return 'delete from '+name+' where id='+id;
	},
	trim: function(model) {
		var attrs = model.toJSON();
		if (!model.db_fields) return attrs;
		for (key in attrs) {
			if (!Underscore.contains(model.db_fields, key))
				delete attrs[key]
		}
		return attrs;
	}
}

var param_statement = function(params) {
	var statement = [];
	for (key in params) {
		var val = params[key];
		if (typeof(val) == 'number')
			statement.push(key+'=='+val);
		else if (typeof(val) == 'string')
			statement.push(key+'=="'+val+'"');
	}
	return statement.join(' and ');
}

var db = {
	initialize: function() {
		var sqlite = new sqlite3.Database('database.sqlite');
		this.sqlite = sqlite;
		this.init_tables();
		return this;
	},
	init_tables: function() {
		var sqlite = this.sqlite;
		sqlite.run(sql.table('room',{
			owner_id: 'integer',
			queue_id: 'integer',
			rules: 'text'
		}));
		sqlite.run(sql.table('user',{
			username: 'text',
			password: 'text',
			avatar_url: 'text'
		}));
		sqlite.run(sql.table('queue',{
			owner_id: 'integer'
		}));
		sqlite.run(sql.table('video',{
			queue_id: 'integer',
			prev: 'integer',
			next: 'integer',
			url: 'text',
			time: 'integer'
		}));
		sqlite.run(sql.table('mod',{
			user_id: 'integer',
			room_id: 'integer'
		}));
	},
	create: function(model, options){
		var attrs = sql.trim(model);
		var statement = this.sqlite.prepare(sql.insert(model.classname, attrs));
		var self = this;
		var insert = statement.run(function(){
			model.id = this.lastID;
			options.success(model.toJSON()); });
	},
	read: function(model, options){
		if (!model.id) return;
		var statement = sql.get(model.classname, model.id);
		this.sqlite.get(statement, function(err, row){
			if (row && row.password) 
				delete row.password;
			options.success(row);
		});
	},
	read_all: function(model, options){
		var statement = sql.select(model.classname, model.query);
		var arr = [];
		this.sqlite.each(statement, function(err, row){
			arr.push(row);
		}, function(){
			options.success(arr);
		});
	},
	update: function(model, options){
		var attrs = sql.trim(model);
		var statement = sql.update(model.classname, model.id, attrs);
		this.sqlite.run(statement, function(){
			options.success(model.toJSON()) });
	},
	delete: function(model, options){
		this.sqlite.run(sql.delete(model.classname, model.id),
			function(){ options.success(model); });
	}
}

module.exports = db.initialize();
