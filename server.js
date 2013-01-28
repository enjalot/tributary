var express = require('express');
var MongoStore = require('connect-mongo')(express)
var settings = require('./settings');
var request = require('request');

var port = settings.port || 8888;
var sandboxOrigin = settings.sandboxOrigin || "http://sandbox.localhost:8888";

//SERVER SIDE TEMPLATES
GLOBAL.Handlebars = require('handlebars');
require('./templates/server-templates');

//SESSION SETUP
var ONE_YEAR = 1000 * 60 * 60 * 24 * 365;
var mongoConf = {
  type: 'Mongo',
  host: 'localhost',
  port: 27017,
  db: 'tributary'
}

//MONGO SETUP
var mongo = require('mongoskin');
var db = mongo.db(mongoConf.host + ':' + mongoConf.port + '/' + mongoConf.db + '?auto_reconnect');

//collection to store some info on our users
var $users = db.collection("users");
//collection where we store info on inlets that are created and saved
var $inlets = db.collection("inlets");
//collection where we store visits (specifically to particular inlets)
var $visits = db.collection("visits");

//collection where we store images uploaded for thumbnails
var $images = db.collection("images");



var app = express()
  .use(express.cookieParser())
  .use(express.bodyParser())
  .use(express.session({
    secret: settings.SECRET,
    cookie: {maxAge: ONE_YEAR},
    store: new MongoStore(mongoConf)
  }))
  .use('/static', express.static(__dirname + '/static'))
  
app.use(express.vhost('sandbox.localhost', require(__dirname + '/sandbox').app))


app.get("/", index);
function index(req, res, next) {
  res.sendfile(__dirname + '/templates/index.html');
};

app.get("/svgopen2012", svgopen);
function svgopen(req, res, next) {
  res.sendfile(__dirname + '/templates/svgopen2012.html');
};


//API endpoint for fetching a gist from github
app.get("/gist/:gistid", getgist_endpoint);
function getgist_endpoint(req, res, next) {
  getgist(req.params.gistid, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      res.header("Content-Type", 'application/json');
      res.send(body);
    } else {
      res.send(response.statusCode);
    }
  })
}

function getgist(gistid, callback) {
  var url = 'https://api.github.com/gists/' + gistid
    + "?client_id=" + settings.GITHUB_CLIENT_ID
    + "&client_secret=" + settings.GITHUB_CLIENT_SECRET;

  request.get(url, callback);
}

//Base view in tributary.
app.get('/inlet', inlet)
app.get('/inlet/:gistid', inlet)
app.get('/tributary', inlet)
app.get('/tributary/:gistid', inlet)
//backwards compatible endpoints...
app.get('/tributary/:gistid/:filename', inlet)
app.get('/delta/:gistid', inlet)
app.get('/delta/:gistid/:filename', inlet)
function inlet(req,res,next) {
  var gistid = req.params['gistid'];
  var user = req.session.user;
  if(gistid) {
    //record this visit
    var visit = {
      gistid: gistid
    , createdAt: new Date()
    }
    if(user) {
      visit.user = {
        id: user.id
      , login: user.login
      }
    }
    $visits.save(visit, function(err, res) { if(err) console.log(err) });
  }
  var template = Handlebars.templates.header;
  var html = template({
    user: user,
    avatar_url: user? user.avatar_url : "",
    loggedin: user ? true : false,
    gistid: gistid,
    sandboxOrigin: sandboxOrigin
  });
  res.send(html);
}

//Save an inlet
app.post('/tributary/save', save_endpoint)
app.post('/tributary/save/:gistid', save_endpoint)
function save_endpoint(req,res,next) {
  var data = req.body.gist;
  var token = req.session.access_token;
  var gistid = req.params['gistid'];
  save(gistid, data, token, function(err, response) {
    if(!err) {
      //post save
      after_save(response, function(error, newgist) {
        if(!error && newgist) {
          return res.send(newgist);
        }
        res.send(error);
      })
      //return updated gist
    } else {
      res.send(err);
    }
  })
}

//Fork an inlet
app.post('/tributary/fork', fork_endpoint)
app.post('/tributary/fork/:gistid', fork_endpoint)
function fork_endpoint(req,res,next) {
  var data = req.body.gist;
  var token = req.session.access_token;
  var user = req.session.user;
  var gistid = req.params['gistid'];

  //get the user of this gist
  if(!gistid || !user) {
    //No id, so creating a new gist
    //or anan user, can't make anon fork so create new gist
    console.log("creating new gist");
    newgist(data, token, function (err, response) {
      if(!err) {
        if(!user) return res.send(response);
        console.log("after fork");
        after_fork(undefined, response, token, function(error, newgist) {
          if(!error) {
            return res.send(newgist);
          }
          res.send(error);
        })
      } else {
        res.send(err);
      }
    })
  } else {
    getgist(gistid, function(err, response, body) {
      if(!err && response.statusCode === 200) {
        var oldgist = JSON.parse(body);

        if( !oldgist.user || oldgist.user.id !== user.id) {
          console.log("forking gist");
          //we don't use github's fork because it doesn't accept changes made
          //by another user
          //fork(gistid, data, token, onResponse);
          newgist(data, token, onResponse);
        } else {
          //logged in user can't fork themselves
          //so create a new gist
          console.log("forking self");
          newgist(data, token, onResponse);
        }

        function onResponse(err, response) {
          if(!err) {
            //post fork. but only if user is authenticated
            console.log("after fork");
            after_fork(oldgist, response, token, function(error, newgist) {
              if(!error) {
                return res.send(newgist);
              }
              res.send(error);
            })
          }
        }
      } else {
        res.send(response.statusCode);
      }
    })
  }
}

function newgist(data, token, callback) {
  //USER saves new gist
  var url = 'https://api.github.com/gists'
  var method = "POST";
  var headers = {
      'content-type': 'application/json'
    , 'accept': 'application/json'
  };
  if(token) {
    headers['Authorization'] = 'token ' + token;
  }

  request({
    url: url,
    body: data.toString(),
    method: method,
    headers: headers
  }, onResponse)

  function onResponse(error, response, body) {
    if (!error && response.statusCode == 201) {
      callback(null, JSON.parse(body));
    } else {
      callback(error, null);
    }
  }
}

function save(gistid, data, token, callback) {
  //USER saves over existing gist
  var url = 'https://api.github.com/gists/' + gistid
  var method = "PATCH";
  var headers = {
      'content-type': 'application/json'
    , 'accept': 'application/json'
    , 'Authorization': 'token ' + token
  };

  var string = data.toString();

  request(url,{
    body: string,
    method: method,
    headers: headers
  }, onResponse)

  function onResponse(error, response, body) {
    if (!error && response.statusCode == 200) {
      callback(null, JSON.parse(body));
    } else {
      callback(error, response.statusCode);
    }
  }
}

//Fork an inlet
function fork(gistid, data, token, callback) {
  //NOTE: this will only work when an authenticated user
  //forks a gist that is not his or hers
  var url = 'https://api.github.com/gists/' + gistid + '/forks'
  var method = "POST";
  var headers = {
    'Authorization': 'token ' + token
  }

  request({
    url: url,
    method: method,
    body: "{}",
    headers: headers
  }, onResponse)

  function onResponse(error, response, body) {
    if (!error && response.statusCode == 201) {
      callback(null, JSON.parse(body));
    } else {
      callback(error, null);
    }
  }
}

//post save functionality
function after_fork(oldgist, newgist, token, callback) {
  //update history in _.md and provide live urls
  //check for existing _.md in oldgist
  var gist_hist = "";
  try {
    gist_hist = oldgist.files["_.md"].content;
  } catch (e) {
  } finally {
  }

  if(!newgist) return callback({status:500}, null)
  var user = newgist.user;
  var name = "anon";
  if(newgist.user) name = newgist.user.login;
  var markdown = "[ <a href=\"http://tributary.io/inlet/" + newgist.id +"\">Launch: " + newgist.description + "</a> ] "
    + newgist.id
    + " by " + name
    + "<br>"

  markdown += gist_hist;
  newgist.files['_.md'] = {
    "content": markdown
  }

  //update/set raw url for thumbnail in config

  var inlet_data = {
    gistid: newgist.id
  , createdAt: new Date()
  , description: newgist.description
  }

  if(newgist.user) {
    inlet_data.user = {
      id: newgist.user.id
      , login: newgist.user.login
    }
  }

  //update mongo
  if(oldgist) {
    //this is a fork, update the old gist
    inlet_data.parent = oldgist.id;
  }

  try {
      var config = JSON.parse(gist.files['config.json'].content);
      var thumbnail = config.thumbnail;
      if(thumbnail) {
        inlet_data.thumbnail = thumbnail;
      }
    } catch (e) {}

  $inlets.save(inlet_data, function(err, result) { if(err) console.error(err); });

  save(newgist.id, JSON.stringify(newgist), token, callback);
}

//post save functionality
function after_save(gist, callback) {
  //update the raw url for the thumbnail

  //save info in mongo.
  //if gist doesn't exist in mongo, we create it, otherwise we update it.
  $inlets.findOne({gistid: gist.id}, function(err, mgist) {
    if(!mgist) {
      mgist = { 
        gistid: gist.id,
        createdAt: new Date(),
        description: gist.description
      }
    }
    mgist.user = {
      id: gist.user.id
    , login: gist.user.login
    }
    mgist.description = gist.description
    mgist.lastSave = new Date();
    try {
      var config = JSON.parse(gist.files['config.json'].content);
      var thumbnail = config.thumbnail;
      mgist.thumbnail = thumbnail;
    } catch (e) {}
    $inlets.update({ gistid: gist.id}, mgist, {upsert:true}, function(err, result) { if(err) console.error(err); });
  })
  callback(null, gist);
}


/*
 * Authentication
 */
app.get("/github-authenticated", github_authenticated)
function github_authenticated(req,res,next) {
    var tempcode = req.query.code || '';
    var data = {'client_id': settings.GITHUB_CLIENT_ID, 'client_secret': settings.GITHUB_CLIENT_SECRET, 'code': tempcode }
    var headers = {'content-type': 'application/json', 'accept': 'application/json'}

    // request an access token
    request({
      url:'https://github.com/login/oauth/access_token',
      json: data,
      headers: headers
    }, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var access_token = body.access_token;
        req.session.access_token = access_token;

        request("https://api.github.com/user?access_token=" + access_token, function(e,r,b){
          if (!e && r.statusCode == 200) {
            //store info about the user in the session
            req.session.user = JSON.parse(b);
            var user = req.session.user;

            $users.update({ id: user.id}
            , user
            , { upsert: true }, function(err, result) { if(err) console.error(err); });
            //redirect to where the user was
            if(req.query.state && req.query.state !== "/undefined"){
              res.redirect(req.query.state)
            } else {
              res.redirect('/inlet');
            }
          }
        })

      } else {
        console.log("authentication error!", error);
      }
    })
}

app.get('/github-login', github_login)
app.get('/github-login/:product', github_login)
app.get('/github-login/:product/:id', github_login)
function github_login(req,res,next) {
  var product, id;
  var url = "https://github.com/login/oauth/authorize?client_id="
      + settings.GITHUB_CLIENT_ID
      + "&scope=gist";

  if(req.params['product']) {
    product = '/' + req.params['product'];
  } else {
    product = "/inlet";
  }
  if(req.params['id']) {
    id = '/' + req.params['id']
  } else {
    id = '';
  }
  url += "&state=" + product + id;
  res.redirect(url);
}

app.get('/github-logout', github_logout)
app.get('/github-logout/:product', github_logout)
app.get('/github-logout/:product/:id', github_logout)
function github_logout(req,res,next) {
  req.session.access_token = null;
  req.session.user = null;
  if(req.params['product']) {
    product = '/' + req.params['product'];
  } else {
    product = "/inlet";
  }
  if(req.params['id']) {
    id = '/' + req.params['id']
  } else {
    id = '';
  }
  res.redirect(product + id);
}


//IMGUR
app.get("/imgur-authenticated", imgur_authenticated)
function imgur_authenticated(req,res,next) {
  //TODO: set this up
  console.log("imgur authenticated");
  next();
}

app.post("/imgur/upload/thumbnail", imgur_upload) 
function imgur_upload(req,res,next) {
  var data = req.body.image;
  var user = req.session.user;
  if(!user) { return res.send({status: 401}); }

  var url = 'https://api.imgur.com/3/image'
  var method = "POST";
  var headers = {
    'Authorization': 'Client-ID ' + settings.IMGUR_CLIENT_ID
  };

  request({
    url: url,
    json: {"image": data},
    method: method,
    headers: headers
  }, onResponse)

  function onResponse(error, response, body) {
    if (!error && response.statusCode == 200) {
      //save in mongo
      var image_data = {
        link: body.data.link
      , deletehash: body.data.deletehash
      , user: { 
          id: user.id
        , login: user.login
        }
      }
      $images.save(image_data, function(err, result) { if(err) console.error(err); });
    } else {
    }
    res.send(body)
  }

}
 


//API

app.get('/api/latest/created', latest_created)
function latest_created(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  var query = {};
  //TODO: pagination
  var limit = 200;
  $inlets.find(query, {limit: limit}).sort({ createdAt: -1 }).toArray(function(err, inlets) {
    if(err) res.send(err);
    res.send(inlets);
  })
}
app.get('/api/latest/forks', latest_forks)
function latest_forks(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  var query = {
    parent: {$exists: true}
  };
  //TODO: pagination
  var limit = 200;
  $inlets.find(query, {limit: limit}).sort({ createdAt: -1 }).toArray(function(err, inlets) {
    if(err) res.send(err);
    res.send(inlets);
  })
}

app.get('/api/latest/visits', latest_visits)
app.get('/api/latest/visits/:start/:end', latest_visits)
function latest_visits(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  var start = req.params.start || new Date(new Date() - (24 * 60 * 60 * 1000));
  var end = req.params.end || new Date();
  var query = dateQuery(start, end);
  //TODO: pagination
  var limit = 2000;
  $visits.find(query, {limit: limit}).sort({ createdAt: -1 }).toArray(function(err, inlets) {
    if(err) res.send(err);
    res.send(inlets);
  })
}

app.get('/api/users', api_users) 
app.get('/api/users/:sortby/:limit/:ascdsc', api_users) 
function api_users(req,res,next) {
  res.header("Access-Control-Allow-Origin", "*");
  var sortBy = req.params.sortby || "createdAt";
  var ascdsc = parseInt(req.params.ascdsc) || 1;
  var limit = req.params.limit || 200;
  var query = {};
  //TODO: pagination
  var fields = {
    name: 1,
    login: 1,
    id: 1,
    avatar_url: 1,
    html_url: 1,
    inlets: 1,
    visits: 1,
    nforks: 1
  }
  var opts = {
    limit: limit
  }
  var sort = {}
  sort[sortBy] = ascdsc
    console.log("SORT", sort)
  //TODO: make sure this is secure in the future
  $users.find(query, fields, opts).sort(sort).toArray(function(err, users) {
    if(err) res.send(err);
    res.send(users);
  })

}


app.get('/api/user/:login/latest', user_latest)
function user_latest(req,res,next) {
  res.header("Access-Control-Allow-Origin", "*");
  var query = { "user.login": req.params.login };
  //TODO: pagination
  var limit = 200;
  $inlets.find(query, {limit: limit}).sort({ createdAt: -1 }).toArray(function(err, inlets) {
    if(err) res.send(err);
    res.send(inlets);
  })
}

//Reporting API
app.get('/api/counts/inlets', counts_inlets) 
app.get('/api/counts/inlets/:start/:end', counts_inlets) 
function counts_inlets(req,res,next) {
  res.header("Access-Control-Allow-Origin", "*");
  var start = req.params.start || new Date(new Date() - (24 * 60 * 60 * 1000));
  var end = req.params.end || new Date();
  var query = dateQuery(start, end);
  //TODO: pagination
  var limit = 200;
  $inlets.count(query, {limit: limit}, function(err, ninlets) {
    if(err) res.send(err);
    res.send({
      start: start,
      end: end,
      count:ninlets
    });
  });
}
app.get('/api/counts/visits', counts_visits) 
app.get('/api/counts/visits/:start/:end', counts_visits) 
function counts_visits(req,res,next) {
  res.header("Access-Control-Allow-Origin", "*");
  var start = req.params.start || new Date(new Date() - (24 * 60 * 60 * 1000));
  var end = req.params.end || new Date();
  var query = dateQuery(start, end);
  //TODO: pagination
  var limit = 200;
  $visits.count(query, {limit: limit}, function(err, nvisits) {
    if(err) res.send(err);
    res.send({
      start: start,
      end: end,
      count:nvisits
    });
  });
}

app.get('/api/most/viewed', most_viewed)
function most_viewed(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  var query = {};
  //TODO: pagination
  var limit = 200;
  $inlets.find(query, {limit: limit}).sort({ "visits": -1 }).toArray(function(err, inlets) {
    if(err) res.send(err);
    res.send(inlets);
  })
}

app.get('/api/most/forked', most_forked)
function most_forked(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  var query = {};
  //TODO: pagination
  var limit = 200;
  $inlets.find(query, {limit: limit}).sort({ "nforks": -1 }).toArray(function(err, inlets) {
    if(err) res.send(err);
    res.send(inlets);
  })
}

app.get('/api',api_endpoints)
var api_routes;
function api_endpoints(req, res, next)	{
  res.header("Access-Control-Allow-Origin","*");
  if (!api_routes) {
	api_routes = {};
    for (rtype in app.routes) { // get, post, put, delete
        api_routes[rtype] = [];
        for (r in app.routes[rtype]) {
          if (app.routes[rtype][r].path.substring(0,4) === "/api") {
            api_routes[rtype].push(app.routes[rtype][r])
          }
        }
    }
  }
  res.send(api_routes);
}

function dateQuery(start, end) {
  var query = {
    $and: [ { createdAt: { $gt: new Date(start)}}, { createdAt:{ $lte: new Date(end)}}],
  }
  return query;
}

app.listen(port, function() {
  console.log("tributary running on port", port);
});

