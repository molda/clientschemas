NEWSCHEMA('Contact').make(function(schema) {

	schema.define('id', 'String(20)');
	schema.define('email', 'Email', true);

	schema.setGet(function(error, model, options, callback) {

		console.log('**** Contact::get', options.id);

		var filter = NOSQL('contacts').one();

		options.id && filter.where('id', options.id);
		options.email && filter.where('email', options.email);

		filter.callback(callback, 'error-404-user');
	});

	schema.setSave(function(error, model, controller, callback) {

		if(!model.id) {
			model.id = UID();
			NOSQL('contacts').insert(model);
			console.log('**** Contact::save insert', model.id);
			callback({success:true, id: model.id});			
		} else
			NOSQL('contacts').modify(model).where('id', model.id).callback(function(count) {
				console.log('**** Contact::save modify', model.id);
				callback({success:true, id: model.id});
			});
	});

	schema.setRemove(function(error, id, callback) {
		NOSQL('contacts').remove().where('id', id).callback(callback);
	});

	schema.setQuery(function(error, options, callback) {

		options = options || { page: 1, max: 10 };

		console.log('**** Contact::query', options);
		options.page = U.parseInt(options.page) - 1;
		options.max = U.parseInt(options.max, 20);

		if (options.page < 0)
			options.page = 0;

		var take = U.parseInt(options.max);
		var skip = U.parseInt(options.page * options.max);
		var filter = NOSQL('contacts').find();

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
		console.log('**** Contact::workflow#login', options);
		callback();
	});
});