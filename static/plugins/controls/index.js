
//You must register your plugin with the global tributary object
//id: the id should match what's in the plugin.json
//function: the plugin function which has access to the tributary instance and
//the plugin object
Tributary.plugin("controls", tributaryControlsPlugin);

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
function tributaryControlsPlugin(tributary, plugin) {
  var el;
  var config = tributary.__config__;

  plugin.activate = function() {
    el = document.getElementById(plugin.elId);

    tributary.__controlEls__ = {};
    tributary.__controls__ = tributary.__config__.get("controls") || {};

    //load control values from config on start
    tributary.events.on("prerender", function() {
      console.log("PRE")
      //tributary.__controlEls__ = {};
      //d3.select(".time_controls").selectAll("div.control").remove();
    })
  }

  plugin.deactivate = function() {
    el = document.getElementById(plugin.elId);
    el.innerHTML = "";
    //TODO: remove all the stuff we added to tributary
    //destroy();
  }

  // get the control element
  function getCE() {
    var sel = d3.select(".time_controls")
      .selectAll("#controls").data([0])
    sel.enter()
      .append("div").attr("id", "controls");
    return sel;
  }
  function exists(val) {
    if(val || val === 0) return true;
    return false;
  }

  function makeSlider(options) {
    var controlElement = getCE();
    var control = controlElement.selectAll('div.control'+ options.name)
      .data([options.name], function(d) { return d })
    var center = control.enter()
    center.append("div").classed("control"+options.name, true);
    center.append("span").text(options.name).append("span").text(":");
    center.append("input")
      .attr({
        type: "range"
      })
    //control.exit().remove();
    control = control.selectAll("input");
    var value = tributary.__controls__[options.name];
    if(!exists(value)) {
      value = (options.max || 0 + options.min || 0) / 2
      tributary.__controls__[options.name] = value;
    }
    control.attr({
      value: value,
      min: options.min,
      max: options.max
    });
    //control.attr("value", tributary.__controls__[options.name]);
    control.on("change", function() { tributary.events.trigger("execute"); });
    return control.node();
  }
  function makeDropdown(options) {
    var controlElement = getCE();
    var control = controlElement.selectAll('div.control'+options.name)
      .data([options.name], function(d) { console.log("D", d); return d })
    var center = control.enter();
    center.append("div").classed("control"+options.name, true);
    center.append("span").text(options.name).append("span").text(":");
    center.append("select");

    console.log("SELECT", control)
    center.select("select").on("change", function() {
      tributary.events.trigger("execute");
    })
    var opts = control.selectAll("option").data(options.options)
    opts.enter()
      .append("option")
    opts.attr({
      value: function(d) { return d },
    }).text(function(d) { return d });
    opts.exit().remove();
    return control.node();
  }

  tributary.control = function(options) {
    //must specify a unique name
    if(!options.name) return 0;
    var name = options.name;
    var value;
    //dropdown menu
    if(options.options && options.options.length) {
      var el = makeDropdown(options);
      console.log("DEL", el)
      value = options.options[el.selectedIndex];
    } else if((options.min || options.min === 0) && (options.max || options.max === 0)) {
      //this is a number
      var el = makeSlider(options);
      console.log("EL", el)
      value = el.value;
    }
    //update config
    tributary.__controlEls__[name] = el;
    tributary.__controls__[name] = value;
    tributary.__config__.set("controls", tributary.__controls__);
    return value;
  };


  return plugin;

}


