var sqlite3 = require('sqlite3').verbose();
// var _u = require('underscore');
// var now = require('./sutils').now;
// var classize = require('./classes.js').classize;

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
		var statement = this.sqlite.prepare(sql.insert(model.classname, model.toJSON()));
		var self = this;
		var insert = statement.run(function(){
			model.id = this.lastID;
			options.success(model.toJSON()); });
	},
	read: function(model, options){
		if (!model.id) return;
		var statement = sql.get(model.classname, model.id);
		this.sqlite.get(statement, function(err, row){
			if (row.password) delete row.password
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
		var statement = sql.update(model.classname, model.id, model.toJSON());
		this.sqlite.run(statement, function(){
			options.success(model.toJSON()) });
	},
	delete: function(model, options){
		this.sqlite.run(sql.delete(model.classname, model.id),
			function(){ options.success(model); });
	}
}

module.exports = db.initialize();

/*
var db = {
	initialize: function(){
		sqlite = new sqlite3.Database('database.sqlite');
		var db = sqlite;
		var dblib = this;
		db.serialize(function() {
			db.run(sql.table('room',{
				owner_id: 'integer',
				queue_id: 'integer',
				rules: 'text'
			}));
			db.run(sql.table('user',{
				username: 'text',
				password: 'text',
				avatar_url: 'text'
			}));
			db.run(sql.table('queue',{
				owner_id: 'integer'
			}));
			db.run(sql.table('video',{
				queue_id: 'integer',
				queue_order: 'integer',
				url: 'text',
				time: 'integer'
			}));
			db.run(sql.table('mod',{
				user_id: 'integer',
				room_id: 'integer'
			}));
		});
		var classnames = ['room','user','queue','video','mod'];
		for (idx in classnames) {
			var classname = classnames[idx];
			this[classname] = function(id) {
				this.id = id;
				this.attr = {};
				this.read = function(callback) {
					if (!this.id) return;
					var self = this;
					var statement = sql.get(this.classname,this.id);
					if (!callback) callback = function(){};
					sqlite.get(statement, function(err, row){
						self.attr = row;
						callback();
					});
				};
				this.find = function(callback) {
					var st = sql.select(this.classname, param_statement(this.attr));
					var self = this;
					sqlite.get(st, function(err, row){
						if (row) {
							self.attr = row;
							self.id = row.id;
						}
						if (callback)
							callback();
					});
				};
				this.save = function(callback) {
					var statement = '';
					if (this.id)
						statement = sql.update(this.classname, this.id , this.attr);
					else statement = sql.insert(this.classname, this.attr);
					sqlite.run(statement, callback);
				};
				this.delete = function() {
					sqlite.run(sql.delete(this.classname,this.id));
				};
				this.associate = function(table, colname, callback) {
					var statement = sql.select(table, colname+'='+this.id);
					var arr = [];
					sqlite.each(statement, function(err, row){
						var obj = new dblib[table](row.id);
						obj.attr = row;
						arr.push(obj);
					}, callback);
					return arr;
				};
				this.json = function() {
					return _u.clone(this.attr);
					// return JSON.stringify(this.attr);
				};
			};
			this[classname].prototype.classname = classname;
			this[classname].all = function(callback) {
				if (!callback) callback = function(){};
				var self = this;
				var statement = sql.all(this.prototype.classname);
				var arr = {};
				sqlite.each(statement, function(err, row){
					var obj = new dblib[self.prototype.classname](row.id);
					obj.attr = row;
					arr[row.id] = obj;
				}, callback);
				return arr;
			};
		};
		return this;
	}
}
*/