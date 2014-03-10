var Backbone = require("backbone");

Backbone.$ = $;

TributaryUi = function(tributary) {
  if (!tributary.ui) {
    tributary.ui = {};
  }
  tributary.trace = false;
  var parentWindow;
  tributary.getGist = function() {
    if (tributary.gistid) {
      getGist(tributary.gistid, function(err, gist) {
        tributary.loadGist(gist, _assemble);
      });
    } else {
      tributary.loadGist(undefined, _assemble);
    }
  };
  if (window) {
    function receiveMessage(event) {
      if (event.origin !== tributary._origin || !event.data) return;
      var data = event.data;
      if (data.request === "load") {
        tributary.gistid = data.gistid;
        parentWindow = event.source;
        tributary.query = data.query;
      } else if (data.request === "save") {
        if (!tributary.__config__.get("thumbnail")) {
          tributary._screenshot();
        }
        var json = serializeGist();
        event.source.postMessage({
          request: "save",
          config: json,
          salt: data.salt
        }, event.origin);
      } else if (data.request === "description") {
        tributary.__config__.set("description", data.description);
      } else if (data.request === "exitfullscreen") {
        tributary.__events__.trigger("fullscreen", false);
      } else if (data.request === "thumbnail") {
        var image = data.image;
        d3.select("#thumb-load").transition().duration(1e3).style("opacity", 0);
        d3.select("#trib-thumbnail").attr("src", image.data.link);
        d3.select("#trib-thumbnail").style("display", "");
        tributary.__config__.set("thumbnail", image.data.link);
      } else if (data.request === "step") {
        if (tributary.step) {
          tributary.step();
        }
      }
    }
    window.addEventListener("message", receiveMessage, false);
    window.is_ready = true;
  }
  tributary.__events__.on("warnchanged", function() {
    if (parentWindow) parentWindow.postMessage({
      request: "warnchanged"
    }, tributary._origin);
  });
  tributary.__events__.on("imgur", function(img) {
    if (parentWindow) {
      d3.select("#thumb-load").style("opacity", 1);
      parentWindow.postMessage({
        request: "imgur",
        img: img
      }, tributary._origin);
    }
  });
  function goFullscreen() {
    if (parentWindow) parentWindow.postMessage({
      request: "fullscreen"
    }, tributary._origin);
  }
  tributary.ui.setup = function() {
    tributary.__events__.on("resize", function() {
      if ($("#container").width() > 767) {
        tributary.sw = $("#container").width() - $("#panel").width();
      } else {
        tributary.sw = $("#container").width();
      }
      if ($("#container").hasClass("fullscreen")) {
        tributary.sw = $("#container").width();
      }
      $("#display").width(tributary.sw + "px");
      tributary.sh = $("#display").height();
      tributary.__events__.trigger("execute");
    });
    tributary.__events__.trigger("resize");
  };
  function _assemble(error, ret) {
    if (error) {
      console.log("error!", error);
      return;
    }
    var config = ret.config;
    tributary.__config__ = config;
    tributary.Main({
      el: d3.select("#display").node()
    });
    var context;
    var edel;
    var editor;
    var type;
    var endpoint = config.get("endpoint");
    if (tributary.endpoint) {
      endpoint = tributary.endpoint;
    }
    if (endpoint === "delta") {
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
    if (!config.get("display")) {
      config.set("display", "svg");
    }
    config.set("endpoint", "");
    var edit = d3.select("#code");
    tributary.edit = edit;
    ret.models.each(function(m) {
      type = m.get("type");
      context = Tributary.makeContext({
        config: config,
        model: m,
        display: d3.select("#display")
      });
      if (context) {
        if (config.newFile) context.newFile = true;
        config.contexts.push(context);
        if (context.render) context.render();
        if (context.execute) context.execute();
        context.editor = Tributary.makeEditor({
          model: m,
          parent: edit
        });
        m.trigger("hide");
      }
    });
    var c = config.contexts[0];
    c.model.trigger("show");
    var files_view = new Tributary.FilesView({
      el: "#file-list",
      model: config
    });
    files_view.render();
    var config_view = new tributary.ConfigView({
      el: "#config",
      model: config
    });
    config_view.render();
    $("#config-toggle").on("click", function() {
      $("#config-content").toggle();
      if ($("#config-toggle").text() == "Config") {
        $("#config-toggle").text("Close Config");
      } else {
        $("#config-toggle").text("Config");
      }
    });
    $("#library-toggle").on("click", function() {
      $("#library-content").toggle();
      if ($("#library-toggle").text() == "Add libraries") {
        $("#library-toggle").text("Close libraries");
      } else {
        $("#library-toggle").text("Add libraries");
      }
    });
    function fullscreenEvent(fullscreen) {
      if (fullscreen || tributary.__fullscreen__) {
        config.set("fullscreen", true);
        $("#container").addClass("fullscreen");
        goFullscreen();
        tributary.__events__.trigger("resize");
      } else {
        config.set("fullscreen", false);
        $("#container").removeClass("fullscreen");
        tributary.__events__.trigger("resize");
      }
    }
    $("#fullscreen").on("click", function() {
      fullscreenEvent(true);
    });
    tributary.__events__.on("fullscreen", fullscreenEvent);
    tributary.__events__.trigger("fullscreen", config.get("fullscreen"));
    tributary.__events__.trigger("loaded");
  }
  function serializeGist() {
    var config = tributary.__config__;
    var gist = {
      description: config.get("description"),
      "public": config.get("public"),
      files: {}
    };
    var code = "";
    config.contexts.forEach(function(context) {
      code = context.model.get("code");
      if (code === "") code = "{}";
      gist.files[context.model.get("filename")] = {
        content: code
      };
    });
    if (config.todelete) {
      config.todelete.forEach(function(filename) {
        gist.files[filename] = null;
      });
    }
    gist.files["config.json"] = {
      content: JSON.stringify(config.toJSON())
    };
    return gist;
  }
  function getGist(id, callback) {
    var ret = {};
    var cachebust = "?cachebust=" + Math.random() * 0xf12765df4c9b2;
    var url = "https://api.github.com/gists/" + id + cachebust;
    $.ajax({
      url: url,
      contentType: "application/json",
      dataType: "json",
      success: function(data) {
        callback(null, data);
      },
      error: function(e) {
        console.log("err", e);
        url = "/gist/" + id + cachebust;
        $.ajax({
          url: url,
          contentType: "application/json",
          dataType: "json",
          success: function(data) {
            callback(null, data);
          },
          error: function(er) {
            console.log("err", er);
            callback(er, null);
          }
        });
      }
    });
  }
  Tributary.FilesView = Backbone.View.extend({
    initialize: function(options) {},
    render: function() {
      var that = this;
      var template = Handlebars.templates.files;
      var config = this.model;
      var contexts = _.map(config.contexts, function(ctx) {
        return ctx.model.toJSON();
      });
      contexts = contexts.sort(function(a, b) {
        if (a.filename < b.filename) return -1;
        return 1;
      });
      var inlet = _.find(contexts, function(d) {
        return d.filename === "inlet.js" || d.filename === "inlet.coffee";
      });
      if (inlet) {
        contexts.splice(contexts.indexOf(inlet), 1);
        contexts.unshift(inlet);
      }
      $(this.el).html(template({
        contexts: contexts
      }));
      var filelist = d3.select("#file-list").selectAll("li.file");
      filelist.on("click", function(d) {
        var filename = this.dataset.filename;
        var ctx = _.find(config.contexts, function(d) {
          return d.model.get("filename") === filename;
        });
        that.model.trigger("hide");
        ctx.model.trigger("show");
        ctx.editor.cm.refresh();
      });
      filelist.select(".delete-file").style("z-index", 1e3).on("click", function() {
        var dataset = this.parentNode.dataset;
        var filename = dataset.filename;
        var name = dataset.filename.split(".")[0];
        config.unset(filename);
        var context = _.find(config.contexts, function(d) {
          return d.model.get("filename") === filename;
        });
        context.model.trigger("delete");
        if (!config.todelete) {
          config.todelete = [];
        }
        if (!context.newFile) config.todelete.push(filename);
        var ind = config.contexts.indexOf(context);
        config.contexts.splice(ind, 1);
        delete context;
        d3.select(that.el).selectAll("li.file").each(function() {
          if (this.dataset.filename === filename) {
            $(this).remove();
          }
        });
        config.contexts.forEach(function(c) {
          return c.model.trigger("hide");
        });
        var othertab = config.contexts[0].model;
        othertab.trigger("show");
        d3.event.stopPropagation();
      });
      var plus = d3.select(this.el).select(".add-file").on("click", function() {
        var input = d3.select(this).select("input").style("display", "inline-block");
        input.node().focus();
        input.on("keyup", keyPress);
        function keyPress() {
          if (d3.event.keyCode === 13) {
            if (input.node().value === "") {
              return input.style("display", "none");
            }
            var context = Tributary.makeContext({
              filename: input.node().value,
              config: config
            });
            if (context) {
              context.newFile = true;
              config.contexts.push(context);
              if (context.render) context.render();
              if (context.execute) context.execute();
              var editor = Tributary.makeEditor({
                model: context.model
              });
              context.editor = editor;
              that.$el.empty();
              that.render();
              config.contexts.forEach(function(c) {
                c.model.trigger("hide");
              });
              context.model.trigger("show");
              editor.cm.focus();
            } else {
              input.classed("error", true);
            }
          }
        }
      });
    }
  });
  Tributary.FileView = Backbone.View.extend({
    render: function() {}
  });
  return tributary;
};