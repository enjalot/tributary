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
    var pluginsDiv = document.getElementById("plugins") || d3.select('body').append("div").attr("id", "plugins").node();
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
  // TODO: add optional cachebuster (maybe based on version of plugin?)
  d3.select("head").append("script")
  .attr({
    id: "js-" + plugin.id,
    src: plugin.url + "/" + plugin.js
  });
  //TODO: check the type of plugin.js and load multiple if it's an array
  Tributary.events.on("pluginLoaded", function(id) {
    if(id === plugin.id)
      callback();
  })
}

//TODO: finish implementing this
function loadRequires(plugin, callback) {
  var required = d3.select("head")
    .selectAll("script.require-" + plugin.id)
    .data(plugin.require || [])

  required.enter()
    .append("script")
    .classed("require-" + plugin.id, true)
    .attr("src", function(d) { return d })
    .on("load", function() {
      //TODO: defer all loaded events and execute once?
      tributary.__events__.trigger("execute");
    })
}

function onErr(err) {
  Tributary.events.trigger("pluginError", err);
  console.log("plugin error", err)
}

tributary.loadPlugin = function (url, opts, cb) {
  d3.json(url, function (err, plugin) {
    if (err) return onErr(err);

    plugin.options = opts;
    plugin.elId = Tributary.newPluginId();
    Tributary.plugins[plugin.id] = plugin;



    var q = queue();
    q.defer(loadCss, plugin);
    q.defer(loadHtml, plugin);
    q.defer(loadScript, plugin)
    //q.defer(loadRequires, plugin)
    q.awaitAll(function (err) {
      if (err) return cb(err);
      Tributary.activatePlugin(tributary, plugin.id);
      cb(null, plugin.id);
    });
  });
};

//plugins are [{ url: "url", options: {} }, ...]
tributary.loadPlugins = function (plugins, options, cb) {
  var q;
  if(options.serial) {
    q = queue(1)
  } else {
    q = queue();
  }
  plugins.forEach(function(plugin) {
    var opts = plugin.options;
    if(!opts) opts = {}
    q.defer(tributary.loadPlugin, plugin.url, opts)
  })
  q.awaitAll(cb)
}

//This is what the plugin calls to register itself
Tributary.plugin = function (id, fn) {
  this.plugins[id].fn = fn;
  Tributary.events.trigger("pluginLoaded", id);
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



