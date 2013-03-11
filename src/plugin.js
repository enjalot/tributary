Tributary.plugins = {};

function loadCss(plugin, callback) {
  if(!plugin.css) { return callback() };
  d3.select("head").append("link")
  .attr({
    rel: "stylesheet",
    id: "css-" + plugin.id,
    href: plugin.url + "/" + plugin.css
  })
  //TODO: check the type of plugin.css and load multiple if it's an array
  callback();
}
  
//Set up HTML
function loadHtml(plugin, callback) {
  if(!plugin.html) { return callback() };
  d3.text(plugin.url + "/" + plugin.html, function(err, html) {
    if(err) return console.error(err);
    var pluginsDiv = document.getElementById("plugins")
    var pluginDiv = document.createElement("div");
    pluginDiv.setAttribute("id", plugin.elId);
    pluginsDiv.appendChild(pluginDiv);
    pluginDiv.innerHTML = html;
    callback();
  });
  //TODO: check the type of plugin.html and load multiple if it's an array
}
  
function loadScript(plugin, callback) {
  if(!plugin.js) { return callback() };
  // Add <script> to page
  // That script invokes tributary.plugin(id, fn), where fn = function (tributary, opts)
  d3.select("head").append("script")
  .attr({
    id: "js-" + plugin.id,
    src: plugin.url + "/" + plugin.js
  });
  //TODO: check the type of plugin.js and load multiple if it's an array
  Tributary.__events__.on("pluginLoaded", function(id) {
    if(id === plugin.id)
      callback();
  })
}

tributary.loadPlugin = function (url, opts, onErr) {
  d3.json(url, function (err, plugin) {
    if (err) return onErr(err);
    
    plugin.options = opts;
    plugin.elId = Tributary.newPluginId();
    Tributary.plugins[plugin.id] = plugin;
   
    var q = queue();
    q.defer(loadCss, plugin);
    q.defer(loadHtml, plugin);
    q.defer(loadScript, plugin)
    q.awaitAll(function (err) {
      if(err) console.error(err);
      //if (err) return onErr(err);
      Tributary.activatePlugin(tributary, plugin.id);
    });
  });
};

//This is what the plugin calls to register itself
Tributary.plugin = function (id, fn) {
  this.plugins[id].fn = fn;
  Tributary.__events__.trigger("pluginLoaded", id);
};

//Once all a plugin's files are loaded, you can instancite it
//and then call the activate method
Tributary.activatePlugin = function(tributary, id) {
  if(this.plugins[id].fn) {
    this.plugins[id].fn(tributary, this.plugins[id]);
    this.plugins[id].activate();
  }
}

Tributary.newPluginId = function() {
  //UUID
  var uid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
  return uid;
}



