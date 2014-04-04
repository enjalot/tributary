var cache = module.exports;

cache.add = function (collection, id, data, callback) {
	if (!collection) {
		throw "No collection provided to store data";
	}

	collection.update({gistid: id}, {gistid: id, data:data}, {upsert:true}, 
		function(err, result) { 
			if(err) console.error(err); 
			if(callback) callback(err, result);
		});
}

cache.get = function (collection, id, callback) {
  console.log("trying to get " + id);
  collection.findOne({"gistid": id}, function(err, data){
  	d = null
  	if(data && data.data) {
  		d = data.data
  	}
  	callback(err,d)
  });
}

cache.invalidate = function(collection, id, callback) {
	collection.remove({"gistid": id}, callback)
}