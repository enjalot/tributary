
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

    tributary.__controls__ = tributary.__config__.get("controls") || {};

    //make sure to active the controls we have loaded from the start
    tributary.__activeControls__ = {};
    var actives = Object.keys(tributary.__controls__);
    actives.forEach(function(active) { tributary.__activeControls__[active] = true });
    //load control values from config on start
    tributary.events.on("prerender", function() {
      tributary.__activeControls__ = {};
    })
    //TODO: this should probably be events
    tributary.events.on("noerror", function() {
      var names = Object.keys(tributary.__activeControls__);
      d3.select(".time_controls").selectAll("div.control").data(names, function(d) { return d })
        .exit().remove();
      var all = Object.keys(tributary.__controls__)
      var key;
      for(var i = 0, l = all.length; i < l; i++) {
        key = all[i];
        if(!~names.indexOf(key)) {
          delete tributary.__controls__[key];
        }
      }
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
    var control = controlElement.selectAll('div.control_'+ options.name)
      .data([options.name])
    var center = control.enter()
      .append("div").classed("control_"+options.name, true).classed("control", true);
    center.append("input")
      .attr({
        type: "range"
      })

    input = control.select("input")
    var value = tributary.__controls__[options.name];
    if(!exists(value)) {
      value = (options.max || 0 + options.min || 0) / 2
      tributary.__controls__[options.name] = value;
    }

    center.append("span").classed("name", true)
      .text(options.name + ": ")
      .append("span").classed("value", true).text(value);

    var attrs = {
      value: value,
      min: options.min,
      max: options.max,
      step: Math.abs((options.max - options.min) / 20)

    }
    if(options.step) {
      attrs.step = options.step
    }
    input.attr(attrs)
    input.on("change", function() {
      control.select("span.value").text(this.value);
      tributary.events.trigger("execute");
    });
    return input.node();
  }
  function makeDropdown(options) {
    var controlElement = getCE();
    var control = controlElement.selectAll('div.control_'+options.name)
      .data([options.name])
    var center = control.enter()
    .append("div").classed("control_"+options.name, true).classed("control", true);
    center.append("select");
    center.append("span").text(options.name)//.append("span").text(":");


    var input = control.select("select")
    input.on("change", function() {
      tributary.__controls__[options.name] = options.options[this.selectedIndex];
      tributary.events.trigger("execute");
    })
    var opts = input.selectAll("option").data(options.options)
    opts.enter()
      .append("option");

    var value = tributary.__controls__[options.name];
    opts.attr({
      value: function(d) { return d },
      selected: function(d) {
        if(value == d) return true;
      },
    }).text(function(d) { return d });
    opts.exit().remove();
    return input.node();
  }

  tributary.control = function(options) {
    //must specify a unique name
    if(!options.name) return 0;
    var name = options.name;
    var value;
    //dropdown menu
    if(options.options && options.options.length) {
      var el = makeDropdown(options);
      value = options.options[el.selectedIndex];
    } else if((options.min || options.min === 0) && (options.max || options.max === 0)) {
      //this is a number
      var el = makeSlider(options);
      value = +el.value;
    }
    //update config
    tributary.__controls__[name] = value;
    tributary.__config__.set("controls", tributary.__controls__);
    tributary.__activeControls__[name] = true;
    return value;
  };


  return plugin;

}


