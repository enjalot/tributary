(function(){
  var ui = {};
  window.ui = ui;

  //UI calculations, we control the dimensions of our various ui components with JS
  //
  //keep track of the screen width and height
  //display is the element where things get rendered into
  var display = d3.select("#display");
  //panel gui controls what's shown in the panel
  var panel_gui = d3.select("#panel_gui");
  //panel holds the editors, and other controls
  var panel= d3.select("#panel");
  //the ui element for resizing the panel
  var panel_handle = d3.select("#panel_handle");
  
  var page = d3.select("#page");
  var header = d3.select("#header");

  tributary.dims = {
    display_percent: 0.70,
    page_width: 0,
    page_height: 0,
    display_width: 0,
    display_height: 0,
    panel_width: 0,
    panel_height: 0,
    panel_gui_width: 0,
    panel_gui_height: 40
  };

  //We control the layout of our UI completely with code, otherwise we are forcing CSS
  //to do something it wasn't meant to do, make an application...
  tributary.events.on("resize", function() {

    tributary.dims.page_width = parseInt(page.style("width"), 10);
    tributary.dims.page_height = parseInt(page.style("height"), 10);

    //calculate how big we want our display to be
    tributary.dims.display_width = tributary.dims.page_width * tributary.dims.display_percent;
    tributary.dims.panel_width = tributary.dims.page_width - tributary.dims.display_width;
    tributary.dims.panel_gui_width = tributary.dims.panel_width;

    tributary.dims.display_height = tributary.dims.page_height - parseInt(header.style("height"),10);
    tributary.dims.panel_height = tributary.dims.display_height - tributary.dims.panel_gui_height;

    //we adjust the size of the ui with javascript because css sucks
    display.style("width", tributary.dims.display_width + "px");
    display.style("height", tributary.dims.display_height + "px");
    panel.style("width", tributary.dims.panel_width + "px");
    panel.style("height", tributary.dims.panel_height + "px");

    panel_gui.style("width", tributary.dims.panel_gui_width + "px");
    panel_gui.style("height", tributary.dims.panel_gui_height + "px");
    //panel_gui.style("margin-top", tributary.dims.panel_gui_height + "px");

    panel_handle.style("right", tributary.dims.panel_width + "px");

    tributary.sw = tributary.dims.display_width;
    tributary.sh = tributary.dims.display_height;
    //update_panel_layout();
  });
  tributary.events.trigger("resize");

  var ph_drag = d3.behavior.drag()
    .on("drag", function() {
      //modify the display % when dragging
      var dx = d3.event.dx/tributary.dims.page_width;
      if(tributary.dims.display_percent + dx >= 0.0 && tributary.dims.display_percent + dx <= 1) {
        tributary.dims.display_percent += dx;
      } 
      tributary.events.trigger("resize");
    })
  panel_handle.call(ph_drag);


  ////////////////////////////////////////////////////////////////////////
  // Setup the Panel GUI for switching between windows in the panel
  ////////////////////////////////////////////////////////////////////////
  
  var panel_data = ["edit", "files", "config", "controls"];
  var pb_w = 60; //width of each button
  var panel_buttons = panel_gui.selectAll("div.pb")
    .data(panel_data)
    .enter()
    .append("div")
    .classed("pb", true)
    .attr({
      id: function(d) { return d + "_tab"; },
    })
  .on("click", function(d) {
    tributary.events.trigger("show", d);
  });

  panel_buttons//.append("text")
    .text(function(d) { return d; });
 
  //Logic for tabs
  tributary.events.on("show", function(name) {
    //hide all panel divs
    $("#panel").children("div")
      .css("display", "none");

    //show the one we want
    panel.select("#" + name)
      .style("display", "");

    //update the panel_gui ui
    panel_gui.selectAll("div.pb")
      .classed("gui_active", false);
    panel_gui.select("#" + name + "_tab")
      .classed("gui_active", true);
  });
  tributary.events.trigger("show", "edit");

function setup_save(config) {
  //Setup the save panel
  $('#savePanel').on('click', function(e) {
    d3.select("#syncing").style("display", "block");
    tributary.save_gist(config, "save", function(newurl, newgist) {
      window.location = newurl;
    });
  });
  $('#forkPanel').on('click', function(e) {
    d3.select("#syncing").style("display", "block");
    tributary.save_gist(config, "fork", function(newurl, newgist) {
      window.location = newurl;
    });
  });
  //Setup the login button
  $('#loginPanel').on('click', function(e) {
    tributary.login_gist(tributary.loggedin, function(newurl, newgist) {
      window.location = newurl;
    }); 
  });
}




  ////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////
  //Assemble the full tributary UI
  ////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////

  ui.assemble = function(gistid) {
    tributary.trace = true;

    if(gistid.length > 0){
      tributary.gist(gistid, _assemble);
    } else {
      var ret = {};
      ret.config = new tributary.Config();
      ret.models = new tributary.CodeModels(new tributary.CodeModel());
      _assemble(ret);
    }

  };

  //callback function to handle response from gist unpacking
  function _assemble(ret) {
    var config = ret.config;

    config.contexts = [];
    var context;
    var edel;
    var editor;
    var type;

    var endpoint = config.get("endpoint");

    if(endpoint === "delta") {
      config.set("display", "svg");
      config.set("play", true);
      config.set("loop", true);
      config.set("autoinit", true);

    } else if (endpoint === "cypress") {
      config.set("display", "canvas");
      config.set("play", true);
      config.set("autoinit", true);

    } else if (endpoint === "curiosity") {
      config.set("display", "webgl");
      config.set("play", true);
      config.set("autoinit", true);
      
    } else if (endpoint === "bigfish") {
      config.set("display", "svg");
      config.set("play", true);
      config.set("autoinit", false);
      
    } else if (endpoint === "fly") {
      config.set("display", "canvas");
      config.set("play", true);
      config.set("autoinit", false);
    }

    if(!config.get("display")) {
      config.set("display", "svg");
    }
    
    var edit = panel.select("#edit");
    tributary.edit = edit;

    ret.models.each(function(m) {
      type = m.get("type");

      //console.log(m, type)
      //if(["md", "svg"].indexOf(type) < 0) {
      //}

      //select appropriate html ui containers
      // and create contexts
      // TODO: if name === "inlet.js" otherwise we do a JSContext for .js
      if(type === "js") {
        //context = new tributary.context_map[config.get("endpoint")]({
        context = new tributary.TributaryContext({
          config: config,
          model: m,
          el: display.node()
        });
        config.contexts.push(context);
        context.render();
        tributary.make_editor({model: m});
      }
      else if(type === "json") {
        context = new tributary.JSONContext({
          config: config,
          model: m,
        });
        config.contexts.push(context);
        context.execute();
        tributary.make_editor({model: m});
      }
      
    });

    //when done, need to execute code (because json/csv etc need to load first)
    config.contexts.forEach(function(c) {
      //select appropriate html ui containers
      // and create contexts
      if(c.model.get("type") === "js") {
        c.execute();
      }
    });

    //fill in the file view
    var config_view = new tributary.ConfigView({
      el: "#config",
      model: config,
    });
    config_view.render();

    //fill in the file view
    var files_view = new tributary.FilesView({
      el: "#files",
      model: config,
    });
    files_view.render();

    //fill in the control view
    var controls_view = new tributary.ControlsView({
      el: "#controls",
      model: config,
    });
    controls_view.render();

    setup_save(config);



    //save tab state
    tributary.events.trigger("show", config.get("tab"));
    tributary.events.on("show", function(name) {
      config.set("tab", name);
    });

    tributary.dims.display_percent = config.get("display_percent");
    tributary.events.trigger("resize");
    tributary.events.on("resize", function() {
      config.set("display_percent", tributary.dims.display_percent);
    });

  } 

  

}());
