exports.install = function() {
	F.route('/', view_index);
	// or
	// F.route('/');
};

function view_index() {
	var self = this;

	console.log('SCRIPT', MODULE('clientschemas').script);
	self.head(MODULE('clientschemas').script);
	self.head(MODULE('clientschemas').script2);
	self.head(MODULE('clientschemas').script3);
	self.view('index');
}