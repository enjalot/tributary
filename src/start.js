//(function(){

var d3 = require('d3');
var _ = require('underscore');
var Backbone = require('backbone');
var Inlet = require('inlet');
var JSHINT = require('jshint');
var cm = require('CodeMirror');
var queue = require('queue-async');

//TODO: these two can't be browserified right now
//var CoffeeScript = require('coffee-script');
//var jsonlint = require('jsonlint');
Tributary = function() {
