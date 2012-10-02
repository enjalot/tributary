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


    tributary.sw = tributary.dims.display_width;
    tributary.sh = tributary.dims.display_height;
    update_panel_layout();
  });
  tributary.events.trigger("resize");


  ////////////////////////////////////////////////////////////////////////
  // Setup the Panel GUI for switching between windows in the panel
  ////////////////////////////////////////////////////////////////////////
  
  var panel_data = ["edit", "files", "config", "controls"];
  var pb_w = 60; //width of each button
  var panel_buttons = panel_gui.selectAll("g.pb")
    .data(panel_data)
    .enter()
    .append("g")
    .classed("pb", true)
    .attr({
      id: function(d) { return d + "_tab"; },
    })
  .on("mouseover", function() {
    d3.select(this).select("text")
      .style("fill", "#00f");
  })
  .on("mouseout", function() {
    d3.select(this).select("text")
      .style("fill", "");
  })
  .on("click", function(d) {
    tributary.events.trigger("show", d);
  });

  panel_buttons.append("rect")
    .attr({
      width: pb_w,
      height: 20
    });
  panel_buttons.append("text")
    .text(function(d) { return d; })
    .attr({
      x: pb_w/2,
      y: 15,
      "text-anchor": "middle",
      //"alignment-baseline": "hanging",
      "pointer-events":"none"
    });

  function update_panel_layout() {
    panel_gui.selectAll("g.pb").attr({
      transform: function(d,i) {
          var x = tributary.dims.panel_gui_width - (i+1) * (pb_w + 5) + 5;
          var y = tributary.dims.panel_gui_height - 20;
          return "translate(" + [x,y] + ")";
        }
    });
  }
  update_panel_layout();

  //Logic for tabs
  tributary.events.on("show", function(name) {
    //hide all panel divs
    $("#panel").children("div")
      .css("display", "none");

    //show the one we want
    panel.select("#" + name)
      .style("display", "");

    //update the panel_gui ui
    panel_gui.selectAll("g.pb")
      .classed("gui_active", false);
    panel_gui.select("#" + name + "_tab")
      .classed("gui_active", true);
  });
  tributary.events.trigger("show", "edit");





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
    ui.editors = [];
    var type;


    var endpoint = config.get("endpoint");

    if(endpoint === "delta") {
      config.set("display", "svg");
      tributary.loops = true;
      tributary.autoinit = true;

    } else if (endpoint === "cypress") {
      config.set("display", "canvas");
      tributary.autoinit = true;

    } else if (endpoint === "curiosity") {
      config.set("display", "webgl");
      tributary.autoinit = true;
      
    } else if (endpoint === "bigfish") {
      config.set("display", "svg");
      tributary.autoinit = false;
      
    } else if (endpoint === "fly") {
      config.set("display", "canvas");
      tributary.autoinit = false;

    }

    if(!config.get("display")) {
      config.set("display", "svg");
    }
    
    var edit = panel.select("#edit");
    ret.models.each(function(m) {
      type = m.get("type");

      //create a div for the editor inside the panel
      edel = edit.append("div")
        .attr("id", m.cid);
      console.log(m, type)

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
        make_editor(edel.node(), m);
      }
      else if(type === "json") {
        context = new tributary.JSONContext({
          config: config,
          model: m,
        });
        config.contexts.push(context);
        context.execute();
        make_editor(edel.node(), m);
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



  }

  function make_editor(container, model) {
    var editor;
    editor = new tributary.Editor({
      el: container,
      model: model
    });
    editor.render();
    ui.editors.push(editor);
    return editor;
  }

}());
