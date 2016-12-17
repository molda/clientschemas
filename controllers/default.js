exports.install = function() {
	F.route('/', view_index);
	// or
	// F.route('/');
};

function view_index() {
	var self = this;

	console.log('script', MODULE('clientschemas').script);
	console.log('script2', MODULE('clientschemas').script2);
	console.log('script3', MODULE('clientschemas').script3);
	self.head(MODULE('clientschemas').script);
	self.head(MODULE('clientschemas').script2);
	self.head(MODULE('clientschemas').script3);
	self.view('index');
}