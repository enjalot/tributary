var request = require('request');

//MONGO SETUP
var mongoConf = {
  type: 'Mongo',
  host: 'localhost',
  port: 27017,
  db: 'tributary'
}
var mongo = require('mongoskin');
var db = mongo.db('mongodb://' + mongoConf.host + ':' + mongoConf.port + '/' + mongoConf.db + '?auto_reconnect');
db.open(function(err, db) {
  //collection to store some info on our users
  var $users = db.collection("users");
  //collection where we store info on inlets that are created and saved
  var $inlets = db.collection("inlets");
  //collection that's the output of mapreduce
  var out = "mr_users";
  var $mr_users = db.collection(out);
  $mr_users.remove({}, function(err) { if(err) console.log(err) });

  function mapUsers() {
    if(this.user) {
      emit(this.user.id, {
        type: "user",
        count: 1,
        visits: this.visits || 0,
        nforks: this.nforks || 0
      })
    }
  }
  function reduceUsers(key, values) {
    var result = {
      count: 0,
      visits: 0,
      nforks: 0
    };
    values.forEach(function(value) {
      if(value.count) {
        result.count += value.count;
      } else {
        result.count += 1;
      }
      if(value.nforks) {
        result.nforks += value.nforks;
      }
      if(value.visits) {
        result.visits += value.visits;
      }
    });
    return result;
  }
  

  var query = {};

  //count up visits by inlet
  $inlets.mapReduce(mapUsers, reduceUsers, {
    out: {reduce: out},
    query: query
  }, function(err, coll) {
    console.log("Users reduced!", err);

    //iterate over the inlets, get the created_at time and set it on the mongo inlet
    $mr_users.find({}, function(err, cursor){ //.toArray(function(err, mr_users) {
      var count = 0;
      function finish() {
        db.close(); 
        process.exit();
      }
      cursor.nextObject(iterator);
      function iterator(err, mr_user) {
        if(!mr_user) return finish();
        console.log("user id", mr_user._id);
        $users.findOne({id: mr_user._id}, function(error, user) {
          if(error || !user ) return cursor.nextObject(iterator);
          user.inlets = mr_user.value.count || 1;
          user.visits = mr_user.value.visits || 1;
          user.nforks = mr_user.value.nforks || 0;
          $users.update({id: user.id}, user, {safe: true}, function(error) { 
            if(error) console.log(error)
            cursor.nextObject(iterator);
          });
        })
      }
    })
  })


})
