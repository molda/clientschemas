F.on('module#clientschemas', function(module) {
	module.init({
		schemas: {
			'Contact': {
				role: '@admin'
			}
		}
	});
});
