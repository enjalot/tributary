var express = require('express');
var MongoStore = require('connect-mongo')(express)
var settings = require('./settings');
var request = require('request');

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


var app = express()
  .use(express.cookieParser())
  .use(express.bodyParser())
  .use(express.session({ 
    secret: settings.SECRET,
    cookie: {maxAge: ONE_YEAR},
    store: new MongoStore(mongoConf)
  }))
  .use('/static', express.static(__dirname + '/static'))
  /*
   * allow CORS?
  .use(function(req,res,next) {
    res.header("Access-Control-Allow-Origin", "*");
    next();
  })
  */

app.get("/", index);
function index(req, res, next) {
  res.sendfile(__dirname + '/templates/index.html');
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
  console.log(url);

  request.get(url, callback);
}

//Base view in tributary.
app.get('/inlet', inlet)
app.get('/inlet/:gistid', inlet)
app.get('/tributary', inlet)
app.get('/tributary/:gistid', inlet)
function inlet(req,res,next) {
  var template = Handlebars.templates.inlet;
  var html = template({
    user: req.session.user,
    loggedin: req.session.user ? true : false,
    gistid: req.params['gistid']
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
        if(!error) {
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
          fork(gistid, data, token, onResponse);
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

  request(url,{
    body: JSON.stringify(data),
    method: method,
    headers: headers
  }, onResponse)

  function onResponse(error, response, body) {
    if (!error && response.statusCode == 200) {
      callback(null, JSON.parse(body));
    } else {
      callback(error, null);
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

  var markdown = "[ <a href=\"http://tributary.io/inlet/" + newgist.id +"\">Launch: " + newgist.description + "</a> ] " 
    + newgist.id 
    + " by " + newgist.user.login 
    + "<br>"

  markdown += gist_hist;
  newgist.files['_.md'] = {
    "content": markdown
  }
  
  //update/set raw url for thumbnail in config

  save(newgist.id, newgist, token, callback);


}

//post save functionality
function after_save(gist, callback) {
  //update the raw url for the thumbnail
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


app.listen(settings.port, function() {
  console.log("tributary running on port", settings.port);
});


