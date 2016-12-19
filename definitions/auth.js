F.onAuthorize = function(req, res, flags, callback){
	flags.push('@admini');
	callback(true);
};