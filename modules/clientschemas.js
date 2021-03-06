exports.name = 'clientschemas',
exports.version = '0.0.1';

var options = {};

var errorResponse = {
	errors: [],
	success: false
};

exports.install = function() {

	F.route('/$$schemas/{schemaname}', schemas, ['post']);

};

function schemas(schemaname) {
	var self = this;
	var payload = this.body;
	var commands = (payload && payload.commands) || [];
	var schemaOptions = options.schemas[schemaname];
	var Schema = GETSCHEMA(schemaname.capitalize());

	if (schemaOptions.authorize && !self.isAuthorized)
		errorResponse.errors.push('NOT_AUTHORIZED');
	console.log('AUTH', schemaOptions.authorize, self.isAuthorized, errorResponse.errors);

	if (schemaOptions.role && self.req.flags.indexOf(schemaOptions.role) < 0)
		errorResponse.errors.push('NOT_AUTHORIZED_ROLE');
	
	if (!schemaOptions)
		errorResponse.errors.push('SCHEMA_NOT_AVAILABLE');

	if (!Schema)
		errorResponse.errors.push('SCHEMA_DOESNT_EXIST');

	if (!payload)
		errorResponse.errors.push('NO_PAYLOAD');

	if (!commands || !commands.length)
		errorResponse.errors.push('NO_COMMAND_SPECIFIED');

	if (errorResponse.errors.length) {
		self.json(errorResponse);
		errorResponse.errors = [];
		return; 
	}

	var index = 0;

	for (var i = 0, l = commands.length; i < l; i++)
		if (commands[i].callback) {
			index = i;
			break;
		}

	var instance = Schema.default().$async(self.callback(), index);

	var fn;
	var index = 0;
	var cb_called = false;

	next();

	function next() {

		var cmd = commands[index];
		fn = instance[cmd.name];

		cmd.params = cmd.params || [];

		if (cmd.callback || (!commands[index + 1] && !cb_called))
			cb_called = true;

		if (cmd.name === '$save')
			U.extend(instance, cmd.params[0]);

		fn = fn.apply(instance, cmd.params);

		if (!commands[index + 1])
			return;

		index++;
		next();
	}
}

exports.init = function(opts) {

	Object.keys(opts.schemas).forEach(function(opt){
		var opt = opts.schemas[opt];
		if (opt.role && !opt.authorize)
			opt.authorize = true;		
	});

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

				if (typeof(options) === 'function') {
					callback = options;
					options = {};
				}

				self.commands.push({
					name: '$get',
					callback: callback ? true : false,
					params: [options]
				});

				if (callback) 
					self.callback = callback;

				return self;
			};

			SchemaInstance.prototype.query = function(options, callback) {
				var self = this;

				if (typeof(options) === 'function') {
					callback = options;
					options = {};
				}

				self.commands.push({
					name: '$query',
					callback: callback ? true : false,
					params: [options]
				});

				if (callback) 
					self.callback = callback;

				return self;
			};

			SchemaInstance.prototype.save = function(options, callback) {
				var self = this;

				if (typeof(options) === 'function') {
					callback = options;
					options = {};
				}

				self.commands.push({
					name: '$save',
					callback: callback ? true : false,
					params: [options]
				});

				if (callback) 
					self.callback = callback;

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

				if (callback) 
					self.callback = callback;

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

				if (callback) 
					self.callback = callback;

				return self;
			};

			SchemaInstance.prototype.exec = function(callback) {
				var self = this;

				if (callback)
					self.callback = callback;

				if (!_schemas[self.name])
					return self.callback('SCHEMA_NOT_AVAILABLE');
				
				_request(self.name, { commands: self.commands }, function(err, response){
					self.callback(err, response);
				});
			};


			function _request(schemaname, data, callback) {

				var xhr = new XMLHttpRequest();

				var cb_called = false;

				xhr.onreadystatechange = function() {

					if (this.readyState == 4) {
						if (this.status == 200) 
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
