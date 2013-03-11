//You must register your plugin with the global tributary object
//id: the id should match what's in the plugin.json
//function: the plugin function which has access to the tributary instance and
//the plugin object
Tributary.plugin("simple", simpleTributaryPlugin);

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
function simpleTributaryPlugin(tributary, plugin) {
  var el;

  plugin.activate = function() {
    el = document.getElementById(plugin.elId);
    //lets mess with the tributary object
    tributary.simple = true;
    //in the user's code, if they console.log(tributary.simple) they should see true!
  }
  
  plugin.deactivate = function() {
    el = document.getElementById(plugin.elId);
    el.innerHTML = "";
  }
  return plugin;
}
 
