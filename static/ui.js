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
    page_width: 0,
    page_height: 0,
    display_width: 0,
    display_height: 0,
    panel_width: 0,
    panel_height: 0,
    display_percent: 0.70,
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
  });
  tributary.events.trigger("resize");




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
    ui.contexts = [];
    var context;
    var edel;
    var editor;
    ui.editors = [];
    var type;
    ret.models.each(function(m) {
      type = m.get("type");
      //select appropriate html ui containers
      // and create contexts
      if(type === "js") {
        context = new tributary.Context({
          model: m,
          el: display.node()
        });
        ui.contexts.push(context);
        context.render();
        make_editor(m);
      }
      else if(type === "json") {
        context = new tributary.JSONContext({
          model: m,
        });
        ui.contexts.push(context);
        context.execute();
        make_editor(m);
      }
      
    });


    //when done, need to execute code (because json/csv etc need to load first)
    ui.contexts.forEach(function(c) {
      //select appropriate html ui containers
      // and create contexts
      if(c.model.get("type") === "js") {
        c.execute();
      }
    });

  }

  function make_editor(model) {
    var editor;
    edel = panel.append("div")
        .attr("id", model.cid);
    editor = new tributary.Editor({
      model: model,
      el: edel.node()
    });
    editor.render();
    ui.editors.push(editor);
    return editor;
  }

}());
