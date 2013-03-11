tributary.newPluginId = function() {
  //UUID
  var uid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
  return uid;
}

//Expects url: "http://path/to/plugin"
//will look for:
//  url + "/index.js"
//  url + "/index.html"
//  url + "/style.css"
tributary.getPlugin = function(url, callback) {
  var pluginUrls = [
    "index.js",
    "index.html",
    "style.css"
  ];
  var q = queue();
  pluginUrls.forEach(function(purl) { 
    q.defer(d3.text, url + "/" + purl);
  });
  q.awaitAll(function(err, pluginContents) {
    if(err) return callback(err);
    var pObj = {
      "js": pluginContents[0],
      "html": pluginContents[1],
      "css": pluginContents[2]
    };
    callback(null, pObj);
  });
}

tributary.setupPlugin = function(pluginContent, options) {
  console.log("setup plugin!", pluginContent);
  //Set up css
  var cssModel = new tributary.CodeModel({
    name: "style", 
    filename: "style.css", 
    code: pluginContent.css 
  });
  cssContext = new tributary.CSSContext({
    config: tributary.__config__,
    model: cssModel,
  });
  cssContext.render();
  cssContext.execute();
  
  //Set up HTML
  if(!options ) {
    var options = {}
  } 
  if(!options.pluginId) options.pluginId = tributary.newPluginId();
  
  var pluginsDiv = document.getElementById("plugins")
  var pluginDiv = document.createElement("div");
  pluginDiv.setAttribute("id", options.pluginId);
  pluginsDiv.appendChild(pluginDiv);
  pluginDiv.innerHTML = pluginContent.html;

  //Set up javascript
  try {
    plugin = new Function("tributary","options", pluginContent.js);
  } catch (e) {
    e.stack;
    console.log("error?", e);
    return false;
  }
  try {
    console.log("activate");
    plugin(tributary, options)
      .activate();
  } catch (e) {
    e.stack;
    console.log("error??", e);
    return false;
  }
  return plugin;
}

//tributary.plugins([url1, url2], function (err, plugins) { });
//@urls: a list of urls, e.g. [url1, url2, url3...]
tributary.plugins = function(urls, callback) {
  var q = queue();
  urls.forEach(function(url) {
    q.defer(tributary.getPlugin, url);
  });
  q.awaitAll(function(err, plugins) {
    plugins.forEach(function(plugin) {
      tributary.setupPlugin(plugin, {});
    });
  })
};


