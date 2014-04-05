var cache = module.exports;

var collectionError = "Cache: No collection provided.";

cache.add = function (collection, id, data, callback) {
	if(collection) {
		collection.update({gistid: id}, {gistid: id, data:data}, {upsert:true}, 
			function(err, result) { 
				if(err) console.error(err); 
				if(callback) callback(err, result);
			});
	}
	else {
		console.error(collectionError);
    callback(collectionError, null);
	}
}

cache.get = function (collection, id, callback) {
	if (!collection) {
		callback(collectionError, null);
	}
	else {
	  //console.log("trying to get " + id);
	  collection.findOne({"gistid": id}, function(err, data){
	  	d = null
	  	if(data && data.data) {
	  		d = data.data
	  	}
	  	callback(err,d)
	  });
	}
}

cache.invalidate = function(collection, id, callback) {
	if(collection) {
		collection.remove({"gistid": id}, callback)
	}
	else {
		console.error(collectionError);
    callback(collectionError, null);
	}
}
