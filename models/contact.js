NEWSCHEMA('Contact').make(function(schema) {

	schema.define('id', 'String(20)');
	schema.define('email', 'Email', true);

	// Gets a specific user
	schema.setGet(function(error, model, options, callback) {

		console.log('**** Contact::get', options);

		var filter = NOSQL('users').one();

		options.id && filter.where('id', options.id);
		options.email && filter.where('email', options.email);

		filter.callback(callback, 'error-404-user');
	});

	schema.setSave(function(error, model, controller, callback) {

		if(!model.id) {
			model.id = UID();
			NOSQL('users').insert(model);
			console.log('Contact::save insert', model);
			callback({success:true, id: model.id});			
		} else
			NOSQL('users').modify(model).where('id', model.id).callback(function(count) {
				console.log('Contact::save modify', model);
				callback({success:true, id: model.id});
			});

	});

	// Removes user from DB
	schema.setRemove(function(error, id, callback) {
		NOSQL('users').remove().where('id', id).callback(callback);
	});

	// Gets listing
	schema.setQuery(function(error, options, callback) {

		options = options || { page: 1, max: 10 };

		console.log('**** Contact::query', options);
		options.page = U.parseInt(options.page) - 1;
		options.max = U.parseInt(options.max, 20);

		if (options.page < 0)
			options.page = 0;

		var take = U.parseInt(options.max);
		var skip = U.parseInt(options.page * options.max);
		var filter = NOSQL('users').find();

		options.search && filter.like('search', options.search.keywords(true, true));

		filter.take(take);
		filter.skip(skip);
		filter.sort('datecreated');

		filter.callback(function(err, docs, count) {
			var data = {};
			data.count = count;
			data.items = docs;
			data.limit = options.max;
			data.pages = Math.ceil(data.count / options.max) || 1;
			data.page = options.page + 1;

			callback(data);
		});
	});

	schema.addWorkflow('login', function(error, model, options, callback) {

		// options.controller
		// options.profile
		// options.type
		console.log('----------- WORKFLOW');
		callback();
	});
});