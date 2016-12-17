F.on('module#clientschemas', function(module){
	module.init({
    	'Contact': {
			authorize: true,
			role: '@admin'
    	}
	});
});