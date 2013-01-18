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

  //iterate over the inlets, get the created_at time and set it on the mongo inlet
  $inlets.find().toArray(function(err, inlets) {
    console.log("do inlets")
    inlets.forEach(function(inlet) {
      if(!inlet.description ) {
        getgist(inlet.gistid, function(err, res, body) {
          inlet.description = JSON.parse(body).description;
          console.log("description", inlet.description)
          $inlets.update({gistid: inlet.gistid}, inlet, {safe: true}, function(error) { if(error) console.log(error)});
        })
      }
    })
    db.close()
  })

  db.close()
})
