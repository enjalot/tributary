//(function(){

var d3 = require('d3');
var queue = require('queue-async');
var _ = require('underscore');
var Backbone = require('backbone');
var Inlet = require('inlet');
var cm = require('CodeMirror');
//Third party includes the codemirror modes and addons, as well as jshint
var thirdparty = require('../static/lib/3rdparty.js');
//TODO: these two can't be browserified right now
//var CoffeeScript = require('coffee-script');
//var jsonlint = require('jsonlint');

Tributary = function() {
