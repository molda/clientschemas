# Client-side schemas for Total.js

**BETA VERSION - uses at your own risk**

## How it works

All you need is the clientshemas.js module.
Then initialize the module, by using bellow code in some definition file

```javascript
F.on('module#clientschemas', function(module) {

	module.init({
		schemas: {
			'Contact': {		// this will allow access to Contact schema
				authorize: true,// same as authorize flag in route definition, uses F.onAuthorize
				role: '@admin'  // same as @role flag in route definition
			}
		}
	});

});
```

### Now it's time to use it on the client

```html
SCHEMA('Contact').save({"email":"smolamartin@seznam.dsf"}, function(err, response){

	console.log('SAVE', err, response);

}).workflow('some-workflow').exec();


SCHEMA('Contact').get({id: <some-id>}, function(err, response){

	console.log('GET', err, response);

}).exec(); 

SCHEMA('Contact').query(function(err, response){

	console.log('QUERY', err, response);

}).exec();
```