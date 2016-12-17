F.on('module#clientschemas', function(module){
	module.init({
		schemas: {
	    	'Contact': {
				authorize: true,
				role: '@admin'
	    	}
		}
	});
});