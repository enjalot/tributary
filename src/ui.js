tributary.ui = {};


var display, panel_gui, panel, panel_handle, page, header;
tributary.ui.setup = function() {
  tributary.events.on("resize", function() {
    if($("#display").width() > 767) {
      tributary.sw = $("#display").width() - $("#panel").width();
    }
    else {
      tributary.sw = $("#display").width();
    }

    if ( $("#container").hasClass("fullscreen") ){
      console.log("Fullscreen")
      tributary.sw = $("#display").width();
    }
    tributary.sh = $("#display").height();

    tributary.events.trigger("execute");
  });
  tributary.events.trigger("resize");

};


////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
//Assemble the full tributary UI
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

tributary.ui.assemble = function(gistid) {
  //tributary.trace = true;
  tributary.trace = false;
  tributary.hint = false;

  if(gistid.length > 0){
    tributary.gist(gistid, _assemble);
  } else {
    var ret = {};
    ret.config = new tributary.Config();
    ret.models = new tributary.CodeModels(new tributary.CodeModel());
    _assemble(null, ret);
  }

};

//callback function to handle response from gist unpacking
function _assemble(error, ret) {
  if(error) {
    console.log("error!", error);
    return;
  }
  var config = ret.config;
  tributary.__config__ = config;

  config.contexts = [];
  var context;
  var edel;
  var editor;
  var type;

  //endpoint is for backwards compatibility with preset tributary
  //configurations
  var endpoint = config.get("endpoint");
  if(tributary.endpoint) {
    endpoint = tributary.endpoint;
  }
  if(endpoint === "delta") {
    config.set("display", "svg");
    config.set("play", true);
    config.set("loop", true);
    config.set("autoinit", true);

  } else if (endpoint === "cypress") {
    config.set("display", "canvas");
    config.set("play", true);
    config.set("autoinit", true);

  } else if (endpoint === "hourglass") {
    config.set("display", "svg");
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
    config.set("restart", true);

  } else if (endpoint === "fly") {
    config.set("display", "canvas");
    config.set("play", true);
    config.set("autoinit", false);
    config.set("restart", true);

  } else if (endpoint === "ocean") {
    config.set("display", "div");

  }

  if(!config.get("display")) {
    config.set("display", "svg");
  }

  //endpoint is for backwards compatibility
  //we shouldn't save it from now on
  config.set("endpoint", "");

  var edit = d3.select("#code");
  tributary.edit = edit;

  ret.models.each(function(m) {
    type = m.get("type");

    context = tributary.make_context({
      config: config,
      model: m,
      display: display
    });
    if(context) {
      config.contexts.push(context);
      context.render();
      if(mainfiles.indexOf(m.get("filename")) < 0) {
        context.execute();
      }
      context.editor = tributary.make_editor({model: m, parent:edit});
      m.trigger("hide");
    }
  });

  //when done, need to execute code (because json/csv etc need to load first)
  config.contexts.forEach(function(c) {
    //select appropriate html ui containers
    // and create contexts
    if(mainfiles.indexOf(c.model.get("filename")) >= 0) {
      c.model.trigger("show");
      //first load should auto init
      tributary.autoinit = true;
      c.execute();
      tributary.autoinit = config.get("autoinit");
    }
  });

  //fill in the file tabs
  var files_view = new tributary.FilesView({
    el: "#file-list",
    model: config,
  });
  files_view.render();

  //wire up the config view
  var config_view = new tributary.ConfigView({
    el: "#config",
    model: config,
  });
  config_view.render();

  //fill in the control view (Config pane)
  var controls_view = new tributary.ControlsView({
    el: "#controls",
    model: config,
  });
  controls_view.render();

  //hook up the control buttons at the bottom
  $("#config-toggle").on("click", function(){
    $("#config-content").toggle();

    if($("#config-toggle").text() == "Config"){
      $("#config-toggle").text("Close Config")
    }
    else {
      $("#config-toggle").text("Config")
    }
  })

  $("#library-toggle").on("click", function(){
    $("#library-content").toggle();

    if($("#library-toggle").text() == "Add libraries"){
      $("#library-toggle").text("Close libraries")
    }
    else {
      $("#library-toggle").text("Add libraries")
    }
  })

  $("#fullscreen").on("click", function(){
    $("#container").addClass("fullscreen")
    $("#exit-fullscreen").show();
    tributary.events.trigger("resize");
  })
  $("#exit-fullscreen").on("click", function(){
    $("#exit-fullscreen").hide();
    $("#container").removeClass("fullscreen")
    tributary.events.trigger("resize");
  })


  setup_header(ret);
  setup_save(ret.config);
}

function setup_header(ret){
  if(ret.user) {
    var gist_uid = ret.user.id;

    $("#inlet-author").html('<a href="https://github.com/' + ret.user.login + '">' + ret.user.login + "</a>")
    $("#gist-title").val(ret.gist.description)
    $("#author-avatar img").attr("src", function(d){
      return "http://2.gravatar.com/avatar/"+ret.user.gravatar_id
    })

    d3.select("title").text("Tributary | "+ret.gist.description || "Tributary")

    if(ret.user.id !== tributary.userid) {
      $('#fork').css("display", "none");
      ret.config.saveType = "fork";
    } else {
      $('#fork').css("display", "");
      ret.config.saveType = "save";
    }
  } else {
     //if the user is not logged in, or no gist we use fork
    if(isNaN(tributary.userid) || !ret.gist) {
      $('#fork').css("display", "none");
      ret.config.saveType = "fork";
    } else {
      ret.config.saveType = "save";
    }
  }

  $("#gist-title").on("keyup", function(){
      //console.log($("#gist-title").val());
      ret.config.set("description", $("#gist-title").val())
      d3.select("title").text($("#gist-title").val())
  })
}

function setup_save(config) {
  //Setup the save panel
  $('#save').off("click");
  $('#save').on('click', function(e) {
    console.log("saving!")
    d3.select("#syncing").style("display", "block");
    tributary.save_gist(config, config.saveType, function(newurl, newgist) {
      d3.select("#syncing").style("display", "none");
      if(config.saveType === "fork") {
        window.onunload = false;
        window.onbeforeunload = false;
        window.location = newurl;
      }
    });
  });
  $('#fork').off("click");
  $('#fork').on('click', function(e) {
    console.log("forking!")
    config.saveType = "fork";
    d3.select("#syncing").style("display", "block");
    tributary.save_gist(config, config.saveType, function(newurl, newgist) {
      window.onunload = false;
      window.onbeforeunload = false;
      window.location = newurl;
    });
  });
  //Setup the login button
  $('#loginPanel').on('click', function(e) {
    tributary.login_gist(tributary.loggedin, function(newurl, newgist) {
      window.onunload = false;
      window.onbeforeunload = false;
      window.location = newurl;
    });
  });
}

