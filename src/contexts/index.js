module.exports = context = {};
context.js = require('./javascript');
context.coffee = require('./coffee');
context.json = require('./json');
context.html = require('./html');
context.svg = require('./svg');
context.csv = require('./csv');

//TODO: as plugins
//context.processing = require('./processing');
//context.derby = require('./derby');
//context.three = require('./three');
//context.glowscript = require('./glowscript');
