exports.name = 'clientschemas',
exports.version ='0.0.1';

var options = {};

var errorResponse = {
	msg: '',
	success: false
};

exports.install = function () {

	F.route('/$$schemas/{schemaname}', schemas, ['post']);

};

function schemas(schemaname) {
	var self = this;
	var payload = this.body;

	var schemaOptions = options.schemas[schemaname];
	errorResponse.msg = 'SCHEMA_NOT_AVAILABLE';
	if(!schemaOptions) return self.json(errorResponse);

	var flags = [];
	if(schemaOptions.authorize) {
		F.onAuthorize(self.req, self.res, flags, function(isAuthorized, user){
			if(!isAuthorized || (schemaOptions.role && flags.indexOf(schemaOptions.role) < 0)) {
				errorResponse.msg = 'NOT_AUTHORIZED';
				return self.json(errorResponse);
			}
			doWork();
		});
	} else 
		doWork();

	function doWork() {

		var Schema = GETSCHEMA(schemaname.capitalize());

		errorResponse.msg = 'SCHEMA_DOESNT_EXIST';
		if(!Schema) return self.json(errorResponse);

		errorResponse.msg = 'NO_PAYLOAD';
		if(!payload) return self.json(errorResponse);

		var commands = payload.commands;
		errorResponse.msg = 'NO_COMMAND_SPECIFIED';
		if(!commands || !commands.length) return self.json(errorResponse);

		var index = 0;

		for(let i = 0, l = commands.length; i < l; i++)
			if(commands[i].callback) {
				index = i;
				break;
			}

		var instance = Schema.default().$async(self.callback(), index);

		var fn;
		var index = 0;
		var cb_called = false;

		next();

		function next(){

			var cmd = commands[index];
			fn = instance[cmd.name];

			cmd.params = cmd.params || [];

			if(cmd.callback || (!commands[index + 1] && !cb_called)) {
				cb_called = true;
			}

			if(cmd.name === '$save') U.extend(instance, cmd.params[0]);
			console.log('CMD', cmd);
			fn = fn.apply(instance, cmd.params);

			if(!commands[index + 1]) return;

			index++;
			next();
		}
	}
}

exports.init = function (opts) {

	options = opts;

	var filename = F.path.temp('clientschemas.js')
	require('fs').writeFile(filename, script(), NOOP);

	F.map('/$$schemas/clientschemas.js', filename);

};


var script = () => U.minifyScript(`
		(function(w) {

		    var _schemas = ${JSON.stringify(options.schemas || {})};

		    w.SCHEMA = function(name) {
		        return new SchemaInstance(name);
		    };

		    function SchemaInstance(name) {
		        var self = this;

		        self.name = name;
		        self.commands = [];
		        self.callback = function() {};

		        return self;

		    };

		    SchemaInstance.prototype.get = function(options, callback) {
		        var self = this;

		        if(typeof(options) === 'function') {
		        	callback = options;
		        	options = {};
		        }

		        self.commands.push({
		            name: '$get',
		            callback: callback ? true : false,
		            params: [options]
		        });

		        if (callback) self.callback = callback;

		        return self;
		    };

		    SchemaInstance.prototype.query = function(options, callback) {
		        var self = this;

		        if(typeof(options) === 'function') {
		        	callback = options;
		        	options = {};
		        }

		        self.commands.push({
		            name: '$query',
		            callback: callback ? true : false,
		            params: [options]
		        });

		        if (callback) self.callback = callback;

		        return self;
		    };

		    SchemaInstance.prototype.save = function(options, callback) {
		        var self = this;

		        if(typeof(options) === 'function') {
		        	callback = options;
		        	options = {};
		        }

		        self.commands.push({
		            name: '$save',
		            callback: callback ? true : false,
		            params: [options]
		        });

		        if (callback) self.callback = callback;

		        return self;
		    };

		    SchemaInstance.prototype.workflow = function(name, options, callback) {
		        var self = this;

		        if (typeof(options) === 'function') {
		            callback = options;
		            options = {};
		        }

		        self.commands.push({
		            name: '$workflow',
		            callback: callback ? true : false,
		            params: [name, options]
		        });

		        if (callback) self.callback = callback;

		        return self;
		    };

		    SchemaInstance.prototype.operation = function(name, options, callback) {
		        var self = this;

		        if (typeof(options) === 'function') {
		            callback = options;
		            options = {};
		        }

		        self.commands.push({
		            name: '$operation',
		            callback: callback ? true : false,
		            params: [name, options]
		        });

		        if (callback) self.callback = callback;

		        return self;
		    };

		    SchemaInstance.prototype.exec = function(callback) {
		        var self = this;
		        if (callback) self.callback = callback;

		        if(!_schemas[self.name]) {
		        	return self.callback('SCHEMA_NOT_AVAILABLE');
				}
		        _request(self.name, { commands: self.commands }, function(err, response){
		        	self.callback(err, response);
		        });
		    };


		    function _request(schemaname, data, callback) {

		        var xhr = new XMLHttpRequest();

		        var cb_called = false;

		        xhr.onreadystatechange = function() {

		            if (this.readyState == 4) {
		            	if(this.status == 200) 
		            		if(!cb_called) return callback(null, JSON.parse(this.responseText));
		            	else
		            		!cb_called && responseError();   
		            	cb_called = true;           	
		            }
		        };

		        xhr.onerror = responseError;
		        xhr.ontimeout = responseError;

		        function responseError(){
		        	!cb_called && callback('Error: Request failed');
		        	cb_called = true;                	
		        }

		        xhr.open('POST', '/$$schemas/' + schemaname, true);
		        xhr.setRequestHeader("Content-Type","application/json");
		        xhr.send(JSON.stringify(data));
		    }

		})(window);
`.trim());