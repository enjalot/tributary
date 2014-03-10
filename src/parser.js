//we allow plugins to add parsers.
tributary.__parsers__ = {};

tributary.__parser__ = function(code, filename) {
  var parsed = esprima.parse(code, {loc:true, raw: true});
  var parsers = Object.keys(tributary.__parsers__);
  if(parsers.length) {
    var parser;
    for(var i = 0; i < parsers.length; i++) {
      parser = tributary.__parsers__[parsers[i]];
      parsed = parser(parsed, code, filename);
    }
  }
  return parsed;
}

