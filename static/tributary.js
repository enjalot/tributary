//(function(){
var d3 = require("d3");

var queue = require("queue-async");

var _ = require("underscore");

var Backbone = require("backbone");

Backbone.$ = $;

var Inlet = require("inlet");

var cm = require("CodeMirror");

var thirdparty = require("../static/lib/3rdparty.js");

Tributary = function() {
  var tributary = {};
  tributary.events = _.clone(Backbone.Events);
  Tributary.__events__ = _.clone(Backbone.Events);
  tributary.data = {};
  window.trib = {};
  window.trib_options = {};
  window.addEventListener("resize", function(event) {
    tributary.events.trigger("resize", event);
  });
  tributary.__mainfiles__ = [ "inlet.js", "inlet.coffee", "inlet.pde", "sinwaves.js", "squarecircle.js" ];
  var reservedFiles = [ "_.md", "config.json" ];
  tributary.displays = [ {
    name: "svg",
    description: "creates an <svg> element for you to use"
  }, {
    name: "canvas",
    description: "creates a <canvas> element and gives you a Context for the canvas"
  }, {
    name: "webgl",
    description: "gives you a Three.js WebGLRenderer scene"
  }, {
    name: "html",
    description: "gives you <div id=display>"
  } ];
  tributary.time_controls = [ {
    name: "play",
    description: "gives you a play button, and tributary.t. if you provide tributary.run(g,t) it will be executed in a run loop"
  }, {
    name: "loop",
    description: "gives you a loop where tributary.t goes from 0 to 1."
  }, {
    name: "restart",
    description: "assumes you only want tributary.init(g) to be run when the restart button is clicked"
  } ];
  Tributary.makeContext = function(options) {
    var context, model, display, type;
    var config = options.config;
    if (options.model) {
      model = options.model;
      filename = model.get("filename");
      type = model.get("type");
    } else {
      var filename, content;
      if (options.filename) {
        filename = options.filename;
      } else {
        filename = "inlet.js";
      }
      if (options.content) {
        content = options.content;
      } else {
        content = "";
      }
      var fn = filename.split(".");
      type = fn[fn.length - 1];
      model = new tributary.CodeModel({
        name: fn[0],
        filename: filename,
        code: content
      });
    }
    if (options.display) {
      display = options.display;
    } else {
      display = d3.select("#display");
    }
    model.set("type", type);
    if (tributary.__mainfiles__.indexOf(filename) >= 0) {
      if (type === "coffee") model.set("mode", "coffeescript");
      if (type === "pde") tributary.__config__.set("display", "canvas");
      context = new tributary.TributaryContext({
        config: config,
        model: model,
        el: display.node()
      });
    } else if (type === "json") {
      model.set("mode", "json");
      context = new tributary.JSONContext({
        config: config,
        model: model
      });
    } else if (type === "csv") {
      model.set("mode", "text");
      context = new tributary.CSVContext({
        config: config,
        model: model
      });
    } else if (type === "tsv") {
      model.set("mode", "text");
      context = new tributary.TSVContext({
        config: config,
        model: model
      });
    } else if (type === "js") {
      context = new tributary.JSContext({
        config: config,
        model: model
      });
    } else if (type === "coffee") {
      model.set("mode", "coffeescript");
      context = new tributary.CoffeeContext({
        config: config,
        model: model
      });
    } else if (type === "css") {
      model.set("mode", "css");
      context = new tributary.CSSContext({
        config: config,
        model: model
      });
    } else if (type === "styl") {
      model.set("mode", "stylus");
      context = new tributary.StylusContext({
        config: config,
        model: model
      });
    } else if (type === "pde") {
      model.set("mode", "javascript");
      tributary.__config__.set("display", "canvas");
      context = new tributary.ProcessingContext({
        config: config,
        model: model
      });
    } else if (type === "html") {
      model.set("mode", "text/html");
      context = new tributary.HTMLContext({
        config: config,
        model: model,
        el: display.node()
      });
    } else if (type === "svg" && filename !== "inlet.svg") {
      model.set("mode", "text/html");
      context = new tributary.SVGContext({
        config: config,
        model: model,
        el: display.node()
      });
    } else if (type === "frag" || type === "geom" || type === "c" || type === "cpp") {
      model.set("mode", "text/x-csrc");
      context = new tributary.TextContext({
        config: config,
        model: model,
        el: display.node()
      });
    } else if (reservedFiles.indexOf(filename) < 0) {
      model.set("mode", "text");
      context = new tributary.TextContext({
        config: config,
        model: model,
        el: display.node()
      });
    }
    return context;
  };
  d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
      this.parentNode.appendChild(this);
    });
  };
  tributary.appendSVGFragment = function(element, fragment) {
    var svgpre = "<svg xmlns=http://www.w3.org/2000/svg xmlns:xlink=http://www.w3.org/1999/xlink>";
    var svgpost = "</svg>";
    var range = document.createRange();
    range.selectNode(element);
    var frag = range.createContextualFragment(svgpre + fragment + svgpost);
    var svgchildren = frag.childNodes[0].childNodes;
    for (var i = 0, l = svgchildren.length; i < l; i++) {
      element.appendChild(svgchildren[0]);
    }
  };
  tributary.getContext = function(filename) {
    if (!tributary.__config__) return;
    var context = _.find(tributary.__config__.contexts, function(d) {
      return d.model.get("filename") === filename;
    });
    return context;
  };
  tributary.getCodeEditor = function(filename) {
    var context = tributary.getContext(filename);
    if (!context || !context.editor) return;
    return context.editor.cm;
  };
  tributary.getModel = function(filename) {
    var context = tributary.getContext(filename);
    if (!context || !context.model) return;
    return context.model;
  };
  tributary.CodeModel = Backbone.Model.extend({
    defaults: {
      code: "",
      filename: "inlet.js",
      name: "inlet",
      type: "js",
      mode: "javascript"
    },
    initialize: function() {
      this.binder();
    },
    binder: function() {
      this.on("error", this.handleError);
      this.on("noerror", this.handleNoError);
    },
    handleError: function(err) {
      tributary.__error__ = true;
      if (tributary.trace) {
        var trace = err.stack;
        var match = trace.match(/eval at \<anonymous\>.*\<anonymous\>:([0-9]+):([0-9]+)/);
        if (match) {
          console.log("Error in " + this.get("filename") + ": line: " + (match[1] - 1) + " column: " + (match[2] - 1) + "\n" + err.toString());
        } else {
          console.error(err);
        }
      }
    },
    handleNoError: function() {
      tributary.events.trigger("noerror");
      tributary.__error__ = false;
    },
    handleCode: function() {
      var code = this.get("code");
      if (this.get("mode") === "coffeescript") {
        js = CoffeeScript.compile(code, {
          bare: true
        });
        return js;
      } else if (this.get("type") === "pde") {
        js = Processing.compile(code).sourceCode;
        return js;
      }
      return code;
    },
    handleParser: function(js) {
      var inline = tributary.__config__.get("inline-console");
      if (inline) {
        try {
          transformed = tributary.__parser__(js, this.get("filename"));
        } catch (e) {
          if (tributary.trace) console.log("PARSE", e.stack);
        }
        try {
          js = escodegen.generate(transformed.ast);
        } catch (e) {
          if (tributary.trace) console.log("GEN", e.stack);
        }
        if (tributary.trace) {
          console.log("JS", js);
        }
      }
      return js;
    },
    local_storage: function(key) {
      if (!key) {
        key = "";
      }
      var ep = this.get("filename") + "/code/" + key;
      return localStorage[ep];
    },
    set_local_storage: function(code, key) {
      var ep = this.get("filename") + "/code/" + key;
      localStorage[ep] = code;
    }
  });
  tributary.CodeModels = Backbone.Collection.extend({
    model: tributary.CodeModel
  });
  tributary.Config = Backbone.Model.extend({
    defaults: {
      description: "Tributary inlet",
      endpoint: "tributary",
      display: "svg",
      "public": true,
      require: [],
      fileconfigs: {},
      fullscreen: false,
      play: false,
      loop: false,
      restart: false,
      autoinit: true,
      pause: true,
      loop_type: "pingpong",
      bv: false,
      nclones: 15,
      clone_opacity: .4,
      duration: 3e3,
      ease: "linear",
      dt: .01
    },
    require: function(callback) {
      var modules = this.get("require");
      var required = d3.select("head").selectAll("script.require").data(modules, function(d) {
        return d.name;
      });
      required.enter().append("script").classed("require", true).attr("src", function(d) {
        return d.url;
      }).on("load", function() {
        tributary.events.trigger("execute");
      });
      required.exit().remove();
      callback(null, null);
    },
    initialize: function() {
      this.contexts = [];
      this.on("hide", function() {
        this.contexts.forEach(function(context) {
          context.model.trigger("hide");
        });
      }, this);
    }
  });
  tributary.ConfigView = Backbone.View.extend({
    initialize: function() {},
    render: function() {
      var that = this;
      var reader = new FileReader;
      function handleFileSelect() {
        var files = d3.event.target.files;
        for (var i = 0, f; f = files[i]; i++) {
          if (!f.type.match("image.*")) {
            console.log("not an image");
            continue;
          }
          reader.onload = function(f) {
            return function(e) {
              var len = "data:image/png;base64,".length;
              var img = e.target.result.substring(len);
              tributary.events.trigger("imgur", img);
            };
          }(f);
          reader.readAsDataURL(f);
        }
      }
      d3.select("#thumbnail-content").select("input").on("change", handleFileSelect);
      var link = this.model.get("thumbnail");
      if (link) {
        d3.select("#thumbnail-content").select("img").attr("src", link).style("display", "");
      }
      var displaySelect = d3.select(this.el).select("#config-content select").on("change", function() {
        var display = this.selectedOptions[0].value;
        that.model.set("display", display);
        tributary.events.trigger("execute");
      });
      this.model.on("change:display", updateDisplayMenu);
      function updateDisplayMenu() {
        var currentDisplay = that.model.get("display");
        displaySelect.selectAll("option").each(function(d, i) {
          if (this.value === currentDisplay) {
            displaySelect.node().value = this.value;
          }
        });
      }
      updateDisplayMenu();
      var editorcontrols = d3.select(this.el);
      editorcontrols.select("#logerrors").on("click", function(d) {
        var dis = d3.select(this);
        if (dis.classed("active")) {
          console.log("Error logging disabled");
          tributary.hint = false;
          tributary.trace = false;
          tributary.events.trigger("execute");
          dis.classed("active", false);
        } else {
          console.log("Error logging initiated");
          tributary.hint = true;
          tributary.trace = true;
          tributary.events.trigger("execute");
          dis.classed("active", true);
        }
      });
      editorcontrols.select("#updatecode").on("click", function(d) {
        var dis = d3.select(this);
        if (dis.classed("active")) {
          console.log("Auto updating disabled");
          tributary.__noupdate__ = true;
          dis.classed("active", false);
        } else {
          console.log("Auto updating initiated");
          tributary.__noupdate__ = false;
          tributary.events.trigger("execute");
          dis.classed("active", true);
        }
      });
      var checkList = d3.select(this.el).select("#library-checklist");
      var libLinks = d3.select(this.el).select("#library-links");
      var name_input = libLinks.select("input.library-title");
      var url_input = libLinks.select("input.library-url");
      function addReq() {
        var req = {
          name: name_input.node().value,
          url: url_input.node().value
        };
        var reqs = that.model.get("require");
        reqs.push(req);
        that.model.require(function(err, res) {});
        that.model.set("require", reqs);
        createLibCheckbox(checkList.selectAll("li.lib").data(reqs).enter());
      }
      var add = libLinks.select(".add-library").on("click", addReq);
      name_input.on("keypress", function() {
        if (d3.event.charCode === 13) {
          addReq();
        }
      });
      url_input.on("keypress", function() {
        if (d3.event.charCode === 13) {
          addReq();
        }
      });
      function createLibCheckbox(selection) {
        var li = selection.append("li").classed("lib", true);
        li.append("input").attr("type", "checkbox").attr("checked", true).on("change", function(d) {
          var reqs = that.model.get("require");
          var ind = reqs.indexOf(d);
          if (ind >= 0) {
            reqs.splice(ind, 1);
            that.model.set("require", reqs);
          } else {
            reqs.push(d);
            that.model.set("require", reqs);
          }
        });
        li.append("a").attr("target", "_blank").attr("href", function(d) {
          return d.url;
        }).text(function(d) {
          return d.name;
        });
      }
      var newCheckboxes = checkList.selectAll("li.lib").data(this.model.get("require")).enter();
      createLibCheckbox(newCheckboxes);
    }
  });
  tributary.Context = Backbone.View.extend({
    initialize: function() {},
    execute: function() {},
    render: function() {}
  });
  tributary.TributaryContext = tributary.Context.extend({
    initialize: function() {
      this.model.on("change:code", function() {
        tributary.events.trigger("execute");
      });
      tributary.events.on("execute", this.execute, this);
      if (!tributary.__config__) {
        if (this.options.config) {
          tributary.__config__ = this.options.config;
        } else {
          tributary.__config__ = new tributary.Config;
        }
      }
      this.model.on("change:code", function() {
        tributary.events.trigger("warnchanged");
      }, this);
      this.config = tributary.__config__;
      this.config.on("change:display", this.set_display, this);
      var config = this.config;
      tributary.init = undefined;
      tributary.run = undefined;
      tributary.autoinit = config.get("autoinit");
      tributary.render = function() {};
      tributary.execute = function() {};
    },
    execute: function() {
      if (tributary.__noupdate__) return;
      try {
        var js = this.model.handleCode();
        js = this.model.handleParser(js);
      } catch (e) {
        this.model.trigger("error", e);
        return false;
      }
      if (this.model.get("type") === "pde") {
        var fn = eval(js);
        if (tributary.__processing__) tributary.__processing__.exit();
        tributary.__processing__ = new Processing(tributary.canvas, fn);
      }
      try {
        tributary.initialize = new Function("g", "tributary", js);
      } catch (e) {
        this.model.trigger("error", e);
        return false;
      }
      try {
        if (tributary.autoinit) {
          tributary.clear();
          tributary.events.trigger("prerender");
        }
        if (tributary.ctx && !tributary.g) {}
        tributary.initialize(tributary.g, tributary);
        if (tributary.autoinit && tributary.init !== undefined) {
          tributary.init(tributary.g, 0);
        }
        tributary.execute();
        tributary.render();
      } catch (err) {
        this.model.trigger("error", err);
        return false;
      }
      this.model.trigger("noerror");
      return true;
    },
    render: function() {
      this.set_display();
    },
    set_display: function() {
      var that = this;
      this.$el.empty();
      var display = this.config.get("display");
      if (display === "svg") {
        this.make_svg();
      } else if (display === "canvas") {
        this.make_canvas();
      } else if (display === "webgl") {
        this.make_webgl();
      } else if (display === "div") {
        tributary.__svg__ = null;
        this.g = d3.select(this.el);
        tributary.g = this.g;
        tributary.clear = function() {
          that.$el.empty();
        };
      } else {
        tributary.clear = function() {
          that.$el.empty();
        };
      }
    },
    make_svg: function() {
      this.svg = d3.select(this.el).append("svg").attr({
        xmlns: "http://www.w3.org/2000/svg",
        xlink: "http://www.w3.org/1999/xlink",
        "class": "tributary_svg",
        width: "100%",
        height: "100%"
      });
      tributary.g = this.svg;
      tributary.__svg__ = this.svg;
      tributary.clear = function() {
        $(tributary.__svg__.node()).empty();
      };
    },
    make_canvas: function() {
      tributary.__svg__ = null;
      tributary.clear = function() {
        tributary.canvas.width = tributary.sw;
        tributary.canvas.height = tributary.sh;
        tributary.ctx.clearRect(0, 0, tributary.sw, tributary.sh);
      };
      tributary.canvas = d3.select(this.el).append("canvas").classed("tributary_canvas", true).node();
      tributary.ctx = tributary.canvas.getContext("2d");
      tributary.g = tributary.ctx;
    },
    make_webgl: function() {
      tributary.__svg__ = null;
      container = this.el;
      tributary.camera = new THREE.PerspectiveCamera(70, tributary.sw / tributary.sh, 1, 1e3);
      tributary.camera.position.y = 150;
      tributary.camera.position.z = 500;
      tributary.scene = new THREE.Scene;
      tributary.scene.add(tributary.camera);
      THREE.Object3D.prototype.clear = function() {
        var children = this.children;
        var i;
        for (i = children.length - 1; i >= 0; i--) {
          var child = children[i];
          if (child == tributary.camera) continue;
          child.clear();
          this.remove(child);
        }
      };
      tributary.renderer = new THREE.WebGLRenderer;
      tributary.renderer.setSize(tributary.sw, tributary.sh);
      container.appendChild(tributary.renderer.domElement);
      var controls = new THREE.TrackballControls(tributary.camera);
      controls.target.set(0, 0, 0);
      controls.rotateSpeed = 1;
      controls.zoomSpeed = .4;
      controls.panSpeed = .8;
      controls.noZoom = true;
      controls.noPan = false;
      controls.staticMoving = false;
      controls.dynamicDampingFactor = .15;
      tributary.useThreejsControls = true;
      tributary.__threeControls__ = controls;
      d3.timer(function() {
        if (tributary.useThreejsControls && tributary.__threeControls__) {
          tributary.__threeControls__.update();
        }
        tributary.render();
      });
      tributary.render = function() {
        tributary.renderer.render(tributary.scene, tributary.camera);
      };
      tributary.render();
      function onWindowResize() {
        windowHalfX = tributary.sw / 2;
        windowHalfY = tributary.sh / 2;
        tributary.camera.aspect = tributary.sw / tributary.sh;
        tributary.camera.updateProjectionMatrix();
        tributary.renderer.setSize(tributary.sw, tributary.sh);
      }
      tributary.events.on("resize", onWindowResize, false);
      tributary.clear = function() {
        tributary.scene.clear();
      };
    }
  });
  tributary.JSONContext = tributary.Context.extend({
    initialize: function() {
      this.model.on("change:code", this.execute, this);
      this.model.on("change:code", function() {
        tributary.events.trigger("execute");
      });
      tributary.events.on("prerender", this.execute, this);
    },
    execute: function() {
      if (tributary.__noupdate__) return;
      try {
        var json = JSON.parse(this.model.get("code"));
        tributary[this.model.get("name")] = json;
      } catch (e) {
        this.model.trigger("error", e);
        return false;
      }
      this.model.trigger("noerror");
      return true;
    },
    render: function() {}
  });
  tributary.JSContext = tributary.Context.extend({
    initialize: function() {
      this.model.on("change:code", this.execute, this);
      this.model.on("change:code", function() {
        tributary.events.trigger("execute");
      });
      tributary.events.on("prerender", this.execute, this);
    },
    execute: function() {
      if (tributary.__noupdate__) return;
      var js = this.model.get("code");
      js = this.model.handleParser(js);
      try {
        eval(js);
      } catch (e) {
        this.model.trigger("error", e);
        return false;
      }
      this.model.trigger("noerror");
      return true;
    },
    render: function() {}
  });
  tributary.CoffeeContext = tributary.Context.extend({
    initialize: function() {
      if (!this.options.silent) {
        this.model.on("change:code", this.execute, this);
      }
      this.model.on("change:code", function() {
        tributary.events.trigger("execute");
      });
      tributary.events.on("prerender", this.execute, this);
    },
    execute: function() {
      if (tributary.__noupdate__) return;
      try {
        var js = this.model.handleCode();
      } catch (err) {
        this.model.trigger("error", err);
        return false;
      }
      try {
        eval(js);
      } catch (err) {
        this.model.trigger("error", err);
        return false;
      }
      this.model.trigger("noerror");
      return true;
    },
    render: function() {}
  });
  tributary.ProcessingContext = tributary.Context.extend({
    initialize: function() {
      this.model.on("change:code", this.execute, this);
      this.model.on("change:code", function() {
        tributary.events.trigger("execute");
      });
      tributary.events.on("prerender", this.execute, this);
    },
    execute: function() {
      if (tributary.__noupdate__) return;
      var pde = this.model.get("code");
      var js = Processing.compile(pde).sourceCode;
      try {
        var fn = eval(js);
        if (tributary.__processing__) tributary.__processing__.exit();
        tributary.__processing__ = new Processing(tributary.canvas, fn);
      } catch (e) {
        this.model.trigger("error", e);
        return false;
      }
      this.model.trigger("noerror");
      return true;
    },
    render: function() {}
  });
  tributary.CSVContext = tributary.Context.extend({
    initialize: function() {
      this.model.on("change:code", this.execute, this);
      this.model.on("change:code", function() {
        tributary.events.trigger("execute");
      });
      tributary.events.on("prerender", this.execute, this);
    },
    execute: function() {
      if (tributary.__noupdate__) return;
      try {
        var json = d3.csv.parse(this.model.get("code"));
        tributary[this.model.get("name")] = json;
      } catch (e) {
        this.model.trigger("error", e);
        return false;
      }
      this.model.trigger("noerror");
      return true;
    },
    render: function() {}
  });
  tributary.TSVContext = tributary.Context.extend({
    initialize: function() {
      this.model.on("change:code", this.execute, this);
      this.model.on("change:code", function() {
        tributary.events.trigger("execute");
      });
      tributary.events.on("prerender", this.execute, this);
    },
    execute: function() {
      if (tributary.__noupdate__) return;
      try {
        var json = d3.tsv.parse(this.model.get("code"));
        tributary[this.model.get("name")] = json;
      } catch (e) {
        this.model.trigger("error", e);
        return false;
      }
      this.model.trigger("noerror");
      return true;
    },
    render: function() {}
  });
  tributary.CSSContext = tributary.Context.extend({
    initialize: function() {
      this.model.on("change:code", this.execute, this);
      this.model.on("change:code", function() {
        tributary.events.trigger("execute");
      });
      tributary.events.on("prerender", this.execute, this);
      this.model.on("delete", function() {
        d3.select(this.el).remove();
      }, this);
    },
    execute: function() {
      if (tributary.__noupdate__) return;
      try {
        this.el.textContent = this.model.get("code");
      } catch (e) {
        this.model.trigger("error", e);
        return false;
      }
      this.model.trigger("noerror");
      return true;
    },
    render: function() {
      this.el = d3.select("head").selectAll("style.csscontext").data([ this.model ], function(d) {
        return d.cid;
      }).enter().append("style").classed("csscontext", true).attr({
        type: "text/css"
      }).node();
    }
  });
  tributary.HTMLContext = tributary.Context.extend({
    initialize: function() {
      this.model.on("change:code", function() {
        tributary.events.trigger("execute");
      });
      tributary.events.on("prerender", this.execute, this);
    },
    execute: function() {
      if (tributary.__noupdate__) return;
      try {
        $(this.el).append(this.model.get("code"));
      } catch (e) {
        this.model.trigger("error", e);
        return false;
      }
      this.model.trigger("noerror");
      return true;
    },
    render: function() {}
  });
  tributary.SVGContext = tributary.Context.extend({
    initialize: function() {
      this.model.on("change:code", function() {
        tributary.events.trigger("execute");
      });
      tributary.events.on("prerender", this.execute, this);
    },
    execute: function() {
      if (tributary.__noupdate__) return;
      try {
        var svg = d3.select(this.el).select("svg").node();
        tributary.appendSVGFragment(svg, this.model.get("code"));
      } catch (e) {
        this.model.trigger("error", e);
        return false;
      }
      this.model.trigger("noerror");
      return true;
    },
    render: function() {}
  });
  tributary.TextContext = tributary.Context.extend({
    initialize: function() {
      this.model.on("change:code", this.execute, this);
      this.model.on("change:code", function() {
        tributary.events.trigger("execute");
      });
    },
    execute: function() {
      if (tributary.__noupdate__) return;
      this.model.trigger("noerror");
      return true;
    },
    render: function() {}
  });
  Tributary.makeEditor = function(options) {
    var editorParent = options.parent || tributary.edit;
    var model = options.model;
    if (options.container) {
      container = options.container;
    } else {
      container = editorParent.append("div").attr("id", model.cid);
    }
    var editor;
    editor = new tributary.Editor({
      el: container.node(),
      model: model
    });
    editor.render();
    return editor;
  };
  tributary.Editor = Backbone.View.extend({
    initialize: function() {
      this.model.on("show", function() {
        d3.select(this.el).style("display", "");
      }, this);
      this.model.on("hide", function() {
        d3.select(this.el).style("display", "none");
      }, this);
      this.model.on("delete", function() {
        this.$el.remove();
      }, this);
    },
    getConfig: function() {
      var fileconfigs = tributary.__config__.get("fileconfigs");
      var fileconfig = fileconfigs[this.model.get("filename")];
      if (!fileconfig) return this.defaultConfig();
      return fileconfig;
    },
    setConfig: function(key, value) {
      var fileconfigs = tributary.__config__.get("fileconfigs");
      var fileconfig = fileconfigs[this.model.get("filename")];
      fileconfig[key] = value;
      var fileconfigs = tributary.__config__.set("fileconfigs", fileconfigs);
    },
    defaultConfig: function() {
      var fileconfigs = tributary.__config__.get("fileconfigs");
      var fileconfig = {
        "default": true,
        vim: false,
        emacs: false,
        fontSize: 12
      };
      fileconfigs[this.model.get("filename")] = fileconfig;
      var fileconfigs = tributary.__config__.set("fileconfigs", fileconfigs);
      return fileconfig;
    },
    render: function() {
      var that = this;
      var dis = d3.select(this.el).classed("editor", true);
      var filetype = that.model.get("type");
      var options = {
        mode: that.model.get("mode"),
        lineNumbers: true,
        viewportMargin: Infinity
      };
      if (filetype == "js") {
        options.theme = "lesser-dark";
        options.gutters = [ "CodeMirror-lint-markers" ];
        options.lintWith = CodeMirror.javascriptValidatorWithOptions({
          asi: true,
          laxcomma: true,
          laxbreak: true,
          loopfunc: true,
          smarttabs: true,
          sub: true
        });
      } else if (filetype == "json") {
        options.mode = "application/json";
        options.gutters = [ "CodeMirror-lint-markers" ];
        options.lintWith = CodeMirror.jsonValidator;
      } else if (filetype == "svg") {
        options.theme = "vibrant-ink";
      } else if (filetype == "html") {
        options.theme = "ambiance";
      } else if (filetype == "coffee") {
        options.theme = "elegant";
      } else if (filetype == "css") {
        options.theme = "elegant";
      } else {
        options.theme = "lesser-dark";
      }
      this.cm = CodeMirror(this.el, options);
      this.cm.on("change", function() {
        var code = that.cm.getValue();
        that.model.set("code", code);
      });
      this.cm.setValue(this.model.get("code"));
      this.inlet = Inlet(this.cm);
      this.model.on("error", function(error) {
        d3.select(that.el).select(".CodeMirror-gutter").classed("error", true);
      });
      this.model.on("noerror", function() {
        d3.select(that.el).select(".CodeMirror-gutter").classed("error", false);
      });
      var toolbar = dis.select(".toolbar");
      var settings = dis.select(".settings").on("click", function() {
        toolbar.classed("hidden", !toolbar.classed("hidden"));
        settings.classed("active-settings", !toolbar.classed("hidden"));
      });
      toolbar.selectAll(".radio").on("change", function() {
        that.setConfig("default", false);
        that.setConfig("vim", false);
        that.setConfig("emacs", false);
        that.setConfig(this.value, true);
        that.cm.setOption("keyMap", this.value);
      });
      toolbar.select(".plusFontSize").on("click", function() {
        var fileconfig = that.getConfig();
        var fontSize = fileconfig.fontSize + 1;
        that.setConfig("fontSize", fontSize);
        var wrap = that.cm.getWrapperElement();
        d3.select(wrap).select(".CodeMirror-scroll").style({
          "font-size": fontSize + "px",
          "line-height": fontSize + "px"
        });
        that.cm.refresh();
      });
      toolbar.select(".minusFontSize").on("click", function() {
        var fileconfig = that.getConfig();
        var fontSize = fileconfig.fontSize - 1;
        that.setConfig("fontSize", fontSize);
        var wrap = that.cm.getWrapperElement();
        d3.select(wrap).select(".CodeMirror-scroll").style({
          "font-size": fontSize + "px",
          "line-height": fontSize + "px"
        });
        that.cm.refresh();
      });
      var fileconfig = that.getConfig();
      var fontSize = fileconfig.fontSize;
      var wrap = that.cm.getWrapperElement();
      d3.select(wrap).select(".CodeMirror-scroll").style({
        "font-size": fontSize + "px",
        "line-height": fontSize + "px"
      });
      that.cm.refresh();
    }
  });
  tributary.loadGist = function(data, callback) {
    var ret = {};
    if (!data) {
      ret.config = new tributary.Config;
      ret.config.newFile = true;
      ret.models = new tributary.CodeModels(new tributary.CodeModel);
      return callback(null, ret);
    }
    var config;
    try {
      config = data.files["config.json"];
    } catch (er) {
      config = false;
    }
    if (config) {
      try {
        ret.config = new tributary.Config(JSON.parse(config.content));
      } catch (e) {
        ret.config = new tributary.Config;
      }
    } else {
      ret.config = new tributary.Config;
    }
    var files = _.keys(data.files);
    fileconfigs = ret.config.get("fileconfigs") || {};
    ret.models = new tributary.CodeModels;
    var fsplit, model, context, i = 0, ext;
    files.forEach(function(f) {
      fsplit = f.split(".");
      ext = fsplit[fsplit.length - 1];
      if (f !== "config.json") {
        model = new tributary.CodeModel({
          filename: f,
          name: fsplit[0],
          code: data.files[f].content,
          type: ext
        });
        ret.models.add(model);
      }
      if (!fileconfigs[f]) {
        fileconfigs[f] = {
          "default": true,
          vim: false,
          emacs: false,
          fontSize: 12
        };
      }
    });
    ret.config.set("fileconfigs", fileconfigs);
    ret.config.require(function(err, res) {
      callback(null, ret);
    });
  };
  tributary.batch = {};
  tributary.batch._execute = function() {
    var funcs = _.functions(this);
    _.each(funcs, function(f) {
      if (f !== "_execute") {
        tributary.batch[f]();
      }
    });
  };
  Tributary.plugins = {};
  function loadCss(plugin, callback) {
    if (!plugin.css) {
      return callback();
    }
    d3.select("head").append("link").attr({
      rel: "stylesheet",
      id: "css-" + plugin.id,
      href: plugin.url + "/" + plugin.css
    });
    callback();
  }
  function loadHtml(plugin, callback) {
    if (!plugin.html) {
      return callback();
    }
    d3.text(plugin.url + "/" + plugin.html, function(err, html) {
      if (err) return console.error(err);
      var pluginsDiv = document.getElementById("plugins") || d3.select("body").append("div").attr("id", "plugins").node();
      var pluginDiv = document.createElement("div");
      pluginDiv.setAttribute("id", plugin.elId);
      pluginsDiv.appendChild(pluginDiv);
      pluginDiv.innerHTML = html;
      callback();
    });
  }
  function loadScript(plugin, callback) {
    if (!plugin.js) {
      return callback();
    }
    d3.select("head").append("script").attr({
      id: "js-" + plugin.id,
      src: plugin.url + "/" + plugin.js
    });
    Tributary.__events__.on("pluginLoaded", function(id) {
      if (id === plugin.id) callback();
    });
  }
  tributary.loadPlugin = function(url, opts, cb) {
    d3.json(url, function(err, plugin) {
      if (err) return onErr(err);
      plugin.options = opts;
      plugin.elId = Tributary.newPluginId();
      Tributary.plugins[plugin.id] = plugin;
      var q = queue();
      q.defer(loadCss, plugin);
      q.defer(loadHtml, plugin);
      q.defer(loadScript, plugin);
      q.awaitAll(function(err) {
        if (err) return cb(err);
        Tributary.activatePlugin(tributary, plugin.id);
        cb(null, plugin.id);
      });
    });
  };
  Tributary.plugin = function(id, fn) {
    this.plugins[id].fn = fn;
    Tributary.__events__.trigger("pluginLoaded", id);
  };
  Tributary.activatePlugin = function(tributary, id) {
    if (this.plugins[id].fn) {
      this.plugins[id].fn(tributary, this.plugins[id]);
      this.plugins[id].activate();
    }
  };
  Tributary.newPluginId = function() {
    var uid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
    return uid;
  };
  return tributary;
};