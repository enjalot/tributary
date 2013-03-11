tributary.ui = {};

tributary.trace = false;
tributary.hint = false;

var parentWindow;

//listen on window postMessage to load gist and handle save/forks
window.addEventListener("message", recieveMessage, false)

function recieveMessage(event) {
  //console.log(event.origin, tributary._origin, event.data);
  if(event.origin !== tributary._origin || !event.data) return;
  var data = event.data;

  if(data.request === "load") {
    //assemble the ui using gist data;
    parentWindow = event.source;
    tributary.query = data.query;
    tributary.loadGist(data.gist, _assemble);
  } else if(data.request === "save") {
    //postMessage the host frame with the tributary.context information
    var json = serializeGist();
    event.source.postMessage({request: "save", config: json, salt: data.salt}, event.origin)
  } else if(data.request === "description") {
    //update the gist's description
    tributary.__config__.set("description", data.description);
  } else if( data.request === "exitfullscreen") {
    tributary.events.trigger("fullscreen", false); 
  } else if( data.request === "thumbnail" ) {
    //we have successful upload!
    var image = data.image;
    d3.select("#trib-thumbnail").attr("src", image.data.link);
    d3.select("#trib-thumbnail").style("display", "");
    tributary.__config__.set("thumbnail", image.data.link);
  }
}

//user has changed code, so let parent frame know not to let them leave too easy ;)
tributary.events.on("warnchanged", function() {
  parentWindow.postMessage({request: "warnchanged" }, tributary._origin);
})
tributary.events.on("imgur", function(img) {
  parentWindow.postMessage({request: "imgur", img: img }, tributary._origin);
})

//let the parent frame know we went fullsize so it can style itself accordingly
function goFullscreen() {
  parentWindow.postMessage({request: "fullscreen" }, tributary._origin);
}



tributary.ui.setup = function() {
  tributary.events.on("resize", function() {
    if($("#display").width() > 767) {
      tributary.sw = $("#display").width() - $("#panel").width();
    }
    else {
      tributary.sw = $("#display").width();
    }

    if ( $("#container").hasClass("fullscreen") ){
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
      display: d3.select("#display")
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

  function fullscreenEvent(fullscreen) {
    console.log("fullscreen!", fullscreen)
    if(fullscreen) {
      config.set("fullscreen", true);
      $("#container").addClass("fullscreen")
      goFullscreen();
      tributary.events.trigger("resize");
    } else {
      config.set("fullscreen", false);
      $("#container").removeClass("fullscreen")
      tributary.events.trigger("resize");
    }
  }
 
  $("#fullscreen").on("click", function() { fullscreenEvent(true) });
  tributary.events.on("fullscreen", fullscreenEvent);
  
  tributary.events.trigger("fullscreen", config.get("fullscreen"))
    
  tributary.events.trigger("loaded");

}

function serializeGist() {
  var config = tributary.__config__;
  var gist = {
    description: config.get("description"),
    public: config.get("public"),
    files: {}
  };

  //save each model back into the gist
  var code = "";
  config.contexts.forEach(function(context) {
    code = context.model.get("code");
    if(code === "") code = "{}";
    gist.files[context.model.get("filename")] = {
      content: code
    };
  });

  if(config.todelete) {
    config.todelete.forEach(function(filename) {
      gist.files[filename] = null;
    })
  }
  //save config
  gist.files["config.json"] = {
    content: JSON.stringify(config.toJSON())
  };

  /*
   * TODO: turn this on when we have a good solution across renders
   * or make it an optional button
  if(config.get("display") === "svg") {
    //serialize the current svg and save it to gist
    var node = d3.select("svg").node();
    var svgxml = (new XMLSerializer()).serializeToString(node);

    if($.browser.webkit){ 
        svgxml = svgxml.replace(/ xlink/g, ' xmlns:xlink');
        svgxml = svgxml.replace(/ href/g, ' xlink:href');
    }
    gist.files["inlet.svg"] = {
      content: svgxml
    };
  }*/
  return gist;
}
