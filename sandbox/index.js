var express = require('express');
var app = express()
  .use(express.bodyParser());
exports.app = app;

var settings = require('../settings');
var origin = settings.origin || "http://localhost:8888";

//SERVER SIDE TEMPLATES
GLOBAL.Handlebars = require('handlebars');
require('./templates/sandbox-templates');

app.get("/", index);
function index(req, res, next) {
  var template = Handlebars.templates.inlet;
  var html = template({ 
    origin: origin
  });
  res.send(html);
};



