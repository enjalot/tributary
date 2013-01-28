var express = require('express');
var app = express()
  .use(express.bodyParser());
exports.app = app;

//SERVER SIDE TEMPLATES
GLOBAL.Handlebars = require('handlebars');
require('./templates/sandbox-templates');

app.get("/", index);
function index(req, res, next) {
  var template = Handlebars.templates.inlet;
  var html = template();
  res.send(html);
};



