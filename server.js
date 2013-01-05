var express = require('express');
var settings = require('./settings');
var request = require('request');
GLOBAL.Handlebars = require('handlebars');

require('./templates/server-templates');

var app = express()
  .use(express.cookieParser())
  .use(express.session({ secret: settings.SECRET }))
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
app.get("/gist/:gistid", getgist);
function getgist(req, res, next) {
  var url = 'https://api.github.com/gists/' + req.params.gistid
    + "?client_id=" + settings.GITHUB_CLIENT_ID 
    + "&client_secret=" + settings.GITHUB_CLIENT_SECRET;

  request(url, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      res.header("Content-Type", 'application/json');
      res.send(body);
    } else {
      res.send(response.statusCode);
    }
  })
}

//
app.get('/inlet', inlet)
app.get('/inlet/:gistid', inlet)
function inlet(req,res,next) {

  var template = Handlebars.templates.inlet;
  var html = template({
    user: req.session.user,
    loggedin: req.session.user ? true : false,
    gistid: req.params['gistid']
  });
  res.send(html);

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
            req.session.user = b;
            
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


