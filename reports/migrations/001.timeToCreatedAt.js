var request = require('request');
var settings = require('../../settings');

function getgist(gistid, callback) {
  var url = 'https://api.github.com/gists/' + gistid
    + "?client_id=" + settings.GITHUB_CLIENT_ID
    + "&client_secret=" + settings.GITHUB_CLIENT_SECRET;

  request.get(url, callback);
}

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
  //collection where we store visits (specifically to particular inlets)
  var $visits = db.collection("visits");

  //iterate over the inlets, get the created_at time and set it on the mongo inlet
  $inlets.find().toArray(function(err, inlets) {
    console.log("do inlets")
    inlets.forEach(function(inlet) {
      if(!inlet.time && !inlet.createdAt) {
        getgist(inlet.gistid, function(err, res, body) {
          inlet.createdAt = new Date(JSON.parse(body).created_at);
          console.log("created at", inlet.createdAt)
          delete inlet.time;
          $inlets.update({gistid: inlet.gistid}, inlet, {safe: true}, function(error) { if(error) console.log(error)});
        })
      } else if(inlet.time) {
        inlet.createdAt = inlet.time;
        delete inlet.time;
        $inlets.update({gistid: inlet.gistid}, inlet, {safe: true}, function(error) { if(error) console.log(error)});
      }
    })
    db.close()
  })

  $visits.find().toArray(function(err, visits) {
    console.log("do visits")
    visits.forEach(function(visit) {
      if(visit.time) {
        visit.createdAt = visit.time;
        delete visit.time;
        $visits.update({_id:visit._id}, visit, {safe: true}, function(error) { if(error) console.log(error)});
      }
    })
    db.close()
  })
  db.close()
})
