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
  //collection where we store info on inlets that are created and saved
  var $inlets = db.collection("inlets");
  //collection that's the output of mapreduce
  var out = "mr_inlets";
  var $mr_inlets = db.collection(out);
  $mr_inlets.remove({});
  //collection where we store visits (specifically to particular inlets)
  var $visits = db.collection("visits");

  function mapVisits() {
    emit(this.gistid, {
      type: "visit",
      count: 1
    })
  }
  function reduceVisits(key, values) {
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
  
  function mapForks() {
    if(this.parent)
      emit(this.parent, {
        type: "fork",
        gistid: this.gistid,
        createdAt: this.createdAt,
        nforks: 0,
        forks: []
      })
  }
  function reduceForks(key, values) {
    var result = {
      nforks: 0,
      forks: []
    };
    values.forEach(function(value) {
      if(value.count) {
        result.count = value.count;
      } 
      if(value.forks && value.forks.length > 0) {
        //if this is already a reduced value, we need to add the number of forks
        //and merge the two arrays
        result.nforks += value.nforks;
        result.forks.push.apply(result.forks, value.forks);
      } else {
        if(value.type === "fork") {
          result.nforks += 1;
          result.forks.push({
            gistid: value.gistid,
            createdAt: value.createdAt
          })
        }
      }
    });
    return result;
  }


  var query = {};

  //count up visits by inlet
  $visits.mapReduce(mapVisits, reduceVisits, {
    out: {reduce: out},
    query: query
  }, function(err, coll) {
    console.log("Visits reduced!", err);
    db.close();

    //Count up and collect forks for each inlet
    $inlets.mapReduce(mapForks, reduceForks, {
      out: {reduce: out},
      query: query
    }, function(err, coll) {
      console.log("Forks reduced!", err);
      db.close();

      //iterate over the inlets, get the created_at time and set it on the mongo inlet
      $mr_inlets.find().toArray(function(err, mr_inlets) {
        mr_inlets.forEach(function(mr_inlet) {
          console.log("inlet id", mr_inlet._id);
          $inlets.findOne({gistid: mr_inlet._id}, function(error, inlet) {
            if(error || !inlet ) return;
            inlet.visits = mr_inlet.value.count || 1;
            inlet.nforks = mr_inlet.value.nforks || 0;
            inlet.forks = mr_inlet.value.forks || [];
            $inlets.update({gistid: inlet.gistid}, inlet, {safe: true}, function(error) { 
              if(error) console.log(error)
              db.close();
            });
          })
        })
        db.close();
      })

    })

  })


  
  //db.close();

})
