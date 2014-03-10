
//You must register your plugin with the global tributary object
//id: the id should match what's in the plugin.json
//function: the plugin function which has access to the tributary instance and
//the plugin object
Tributary.plugin("ajax-caching", tributaryAJAXPlugin);

//tributary is the main object available in inlets
//plugin has some gauranteed elements:
//{
//  elId: a UUID that will also be the element id of a div
//}
//You are expected to return a plugin object with the following methods exposed:
//{
//  activate() { //initializes the plugin },
//  deactivate() { //cleans up after the plugin (removes itself) }
//}
function tributaryAJAXPlugin(tributary, plugin) {
  var el;
  var config = tributary.__config__;

  plugin.activate = function() {
    el = document.getElementById(plugin.elId);

    var button = d3.select("#editorcontrols").append("button").attr("id","ajax-caching").text("AJAX Caching")
      .on("click", function(d) {
        var dis = d3.select(this);
        if( dis.classed("active") ) {
          console.log("AJAX Caching disabled");
          tributary.__config__.set("ajax-caching", false)
          tributary.__events__.trigger("execute");
          dis.classed("active", false)
        }
        else {
          console.log("AJAX Caching initiated");
          tributary.__config__.set("ajax-caching", true)
          tributary.__events__.trigger("execute");
          dis.classed("active", true)
        }
      })
      .classed("active", tributary.__config__.get("ajax-caching"))
  }

  plugin.deactivate = function() {
    el = document.getElementById(plugin.elId);
    el.innerHTML = "";
    //TODO: remove all the stuff we added to tributary
    //destroy();
  }

  var ajaxMethods = [
    "json",
    "csv",
    "tsv",
    "xml",
    "html",
    "text"
  ]
  //this is where we use esprima to interperet our code
  //mainly taken from https://github.com/nornagon/live/blob/master/xform.coffee
  tributary.__parsers__["ajax-caching"] = function(parsed, code, filename) {
    if(!tributary.__config__.get("ajax-caching")) { return parsed }
    __hasProp = {}.hasOwnProperty;

    var transformed;
    var id, nextId = 0;
    function replace(e) {
      if(e.type === 'ExpressionStatement' && e.expression && e.expression.type === 'CallExpression') {
        var callee = e.expression.callee;
        if(callee.object && callee.object.name === 'd3'
        && callee.property
        && (ajaxMethods.indexOf(callee.property.name) > -1)) {
          var method = callee.property.name;
          callee.property.name = 'ajaxJack';
          var pos = e.expression.loc.end;
          pos.line -= 1;
          var newArgs = [
            {
              "type": "ObjectExpression",
              "properties": [
                {
                  "type": "Property",
                  "key": {
                      "type": "Identifier",
                      "name": "line"
                  },
                  "value": {
                      "type": "Literal",
                      "value": pos.line,
                      "raw": pos.line + ""
                  },
                  "kind": "init"
                },
                {
                  "type": "Property",
                  "key": {
                      "type": "Identifier",
                      "name": "ch"
                  },
                  "value": {
                      "type": "Literal",
                      "value": pos.column,
                      "raw": pos.column + ""
                  },
                  "kind": "init"
                },
                {
                  "type": "Property",
                  "key": {
                      "type": "Identifier",
                      "name": "filename"
                  },
                  "value": {
                      "type": "Literal",
                      "value": filename,
                      "raw": filename + ""
                  },
                  "kind": "init"
                },
                {
                  "type": "Property",
                  "key": {
                      "type": "Identifier",
                      "name": "method"
                  },
                  "value": {
                      "type": "Literal",
                      "value": method,
                      "raw": method + ""
                  },
                  "kind": "init"
                }
              ]
            },
            {
            "type": "ArrayExpression",
             "elements": e['expression']['arguments']
            }
          ];
          e['expression']['arguments'] = newArgs;
          //console.log("pos", e, callee.loc.end);
          return transform(e,replace);
        } else {
          return transform(e, replace);
        }
      } else {
        return transform(e, replace);
      }
    }

    //TODO: this is probably more general.
    function transform(object, f) {
      var i, key, newObject, v, value, _i, _len;

      if (object instanceof Array) {
        newObject = [];
        for (i = _i = 0, _len = object.length; _i < _len; i = ++_i) {
          v = object[i];
          if (typeof v === 'object' && v !== null) {
            newObject[i] = f(v);
          } else {
            newObject[i] = v;
          }
        }
      } else {
        newObject = {};
        for (key in object) {
          if (!__hasProp.call(object, key)) continue;
          value = object[key];
          if (typeof value === 'object' && value !== null) {
            newObject[key] = f(value);
          } else {
            newObject[key] = value;
          }
        }
      }
      return newObject;
    }
    transformed = transform(parsed, replace)
    return transformed;
  }

  var urlCache = {};
  // TODO: not put this on d3?
  d3.ajaxJack = function(pos, args) {
    var method = pos.method;
    // the user's url
    var url = args[0]
    var hash = [pos.filename, url].join("_");
    if(!tributary.__data__) tributary.__data__ = {};
    // the user's callback
    var userCb = args[1];
    // our callback
    var ourCb = function(err, result) {
      if(err) return userCb(err);
      urlCache[hash] = url;
      tributary.__data__[hash] = result;
      userCb(null, result);
    }
    args[1] = ourCb;

    // We cache the data for the most recent url call.
    // if the user changes the url for this d3.json call it will be refreshed.
    if(urlCache[hash] === url) {
      return userCb(null, tributary.__data__[hash]);
    }
    d3[method].apply(d3, args);
  }
  return plugin;
}


