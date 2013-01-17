var request = require('request');

//MONGO SETUP
var mongoConf = {
  type: 'Mongo',
  host: 'localhost',
  port: 27017,
  db: 'tributary'
}
var mongo = require('mongoskin');
var db = mongo.db(mongoConf.host + ':' + mongoConf.port + '/' + mongoConf.db + '?auto_reconnect');
db.open(function(err, db) {
  //collection to store some info on our users
  var $users = db.collection("users");
  //collection where we store info on inlets that are created and saved
  var $inlets = db.collection("inlets");
  //collection that's the output of mapreduce
  var out = "mr_users";
  var $mr_users = db.collection(out);
  $mr_users.remove({});

  function mapUsers() {
    if(this.user) {
      emit(this.user.id, {
        type: "user",
        count: 1
      })
    }
  }
  function reduceUsers(key, values) {
    var result = {
      count: 0
    };
    values.forEach(function(value) {
      if(value.count) {
        result.count += value.count;
      } else {
        result.count += 1;
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
    db.close();

    //iterate over the inlets, get the created_at time and set it on the mongo inlet
    $mr_users.find().toArray(function(err, mr_users) {
      var count = 0;
      var num = mr_users.length;
      function finish() {
        count++;
        if(count === num) {
          db.close(); 
          process.exit();
        }
      }
      mr_users.forEach(function(mr_user) {
        console.log("user id", mr_user._id);
        $users.findOne({id: mr_user._id}, function(error, user) {
          if(error || !user ) return finish();
          user.inlets = mr_user.value.count || 1;
          $users.update({id: user.id}, user, {safe: true}, function(error) { 
            if(error) console.log(error)
            finish()
          });
        })
      })
      db.close();
    })

  db.close();

  })


})
