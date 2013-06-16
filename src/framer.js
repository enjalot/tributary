var d3 = require('d3');
var queue = require('queue-async')
module.exports = function(el) {
  var element;
  var iframe;
  var head;
  var styles = [];
  var scripts = [];
  var csss = [];
  var dispatch = d3.dispatch("load", "rebuild", "error");
  
  var framer = function(el) {
    element = el;
    framer.create();
  };
  
  framer.create = function() {
    iframe = document.createElement('iframe');
    el.appendChild(iframe);
    head = iframe.contentDocument.getElementsByTagName("head")[0];
    
    iframe.contentWindow.newFunction = function(code) {
      try {
        var fn = new Function("tributary", code);
        return fn;
      } catch(e) {
        dispatch.error(e)
        return function() {};
      }
    }
  }

  framer.destroy = function() {
    if(iframe) { 
      element.removeChild(iframe);
      iframe = null;
    }
  }
  
  framer.fn = function(code) {
    return iframe.contentWindow.newFunction(code)
  }

  framer.style = function(code) {
    if(styles.indexOf(code) < 0) styles.push(code);
    var style = iframe.contentDocument.createElement("style")
    var text = iframe.contentDocument.createTextNode(code);
    style.appendChild(text);
    head.appendChild(style);
    return style;
  }
  
  framer.script = function(url, cb) {
    if(!cb) {
      cb = function() { dispatch.load(arguments) };
    }
    if(scripts.indexOf(url) < 0) scripts.push(url);
    var script = iframe.contentDocument.createElement("script")
    script.type ="text/javascript";
    script.src = url;
    head.appendChild(script);
    script.addEventListener("load",function(evt) {
      cb(null, evt)
    });
  }
  
  framer.scripts = function(urls, cb) {
    if(!cb) {
      cb = function() { dispatch.load(arguments) };
    }
    var q = queue();
    urls.forEach(function(url) {
      q.defer(framer.script, url);
    })
    q.awaitAll(cb);
  }
  
  framer.css = function(url) {
    if(csss.indexOf(url) < 0) csss.push(url);
    var link = iframe.contentDocument.createElement("link")
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = url;
    head.appendChild(link);
  }
  
  framer.rebuild = function(rbCb) {
    if(!rbCb) {
      rbCb = function() { dispatch.rebuild(arguments) };
    }
    //destroys and recreates the iframe including all calls to set and expose
    framer.destroy();
    framer.create();
    
    function replay(obj, fn, cb) {
      if(cb) {
        var q = queue();
        for(key in obj) {
          q.defer(fn, obj[key]);
        }
        q.awaitAll(cb)
      } else {
        for(key in obj) {
          fn(obj[key]);
        }
      }
    }
    //these are arrays
    replay(styles, framer.style);
    replay(csss, framer.css);
    //scripts load asynchronously
    replay(scripts, framer.script, rbCb);
  }
  
  //convenience accessors
  framer.iframe = function() {
    return iframe;
  }
  framer.doc = function() {
    if(iframe) return iframe.contentDocument;
  }
  framer.head = function() {
    if(iframe) return iframe.contentDocument.getElementsByTagName("head")[0]
  }
  framer.body = function() {
    if(iframe) return iframe.contentDocument.getElementsByTagName("body")[0]
  }
  
  //if the el was passed into the constructor we go ahead and instanciate
  if(el) {
    framer(el);
  }
  d3.rebind(framer, dispatch, "on");
  return framer;
}


