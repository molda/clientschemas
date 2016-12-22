F.onAuthorize = function(req, res, flags, callback){
	flags.push('@admin');
	callback(true);
};