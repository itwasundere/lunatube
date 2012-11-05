var Underscore = require('underscore');
var mysql = require('mysql');

var sql = {
	table: function(name, cols) {
		var pre = 'create table if not exists '+name;
		var strs = ['id int primary key auto_increment'];
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
	ddelete: function(name, id) {
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
		var options = {
			host: 'localhost',
			user: 'root',
			password: 'secret',
			database: 'lunatube'
		};
		if (process.env.VCAP_SERVICES) {
			var cred = JSON.parse(process.env.VCAP_SERVICES)['mysql-5.1'][0].credentials;
			options = {
				host: cred.host,
				user: cred.name,
				password: cred.password,
				port: cred.port
			}
		}
		var store = mysql.createConnection(options);
		this.store = store;
		this.init_tables();
		return this;
	},
	init_tables: function() {
		var store = this.store;
		store.query(sql.table('room',{
			owner_id: 'int',
			queue_id: 'int',
			rules: 'text'
		}));
		store.query(sql.table('user',{
			username: 'text',
			password: 'text',
			avatar_url: 'text'
		}));
		store.query(sql.table('queue',{
			owner_id: 'int'
		}));
		store.query(sql.table('video',{
			queue_id: 'int',
			prev: 'int',
			next: 'int',
			url: 'text',
			time: 'int'
		}));
		store.query(sql.table('moderator',{
			user_id: 'int',
			room_id: 'int'
		}));
	},
	create: function(model, options){
		var attrs = sql.trim(model);
		var statement = sql.insert(model.classname, attrs);
		var self = this;
		console.log(statement);
		this.store.query(statement, function(err, result){
			model.set('id', result.insertId);
			options.success(model.toJSON());
		});
	},
	read: function(model, options){
		if (!model.id) {
			var statement = sql.select(model.classname, param_statement(model.attributes));
			this.store.query(statement, function(err, rows){
				options.success(rows);
			});
			return;
		}
		var statement = sql.get(model.classname, model.id);
		this.store.query(statement, function(err, rows){
			if (!rows || !rows[0]) return;
			var row = rows[0];
			if (row && row.password)
				delete row.password;
			options.success(row);
		});
	},
	read_all: function(model, options){
		var statement = sql.select(model.classname, model.query);
		this.store.query(statement, function(err, rows){
			if (rows)
				options.success(rows);
		});
	},
	update: function(model, options){
		var attrs = sql.trim(model);
		var statement = sql.update(model.classname, model.id, attrs);
		console.log(statement);
		this.store.query(statement, function(){
			options.success(model.toJSON()) });
	},
	ddelete: function(model, options){
		var statement = sql.ddelete(model.classname, model.id);
		console.log(statement);
		this.store.query(statement,
			function(){ options.success(model); });
	}
}

module.exports = db.initialize();