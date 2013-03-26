//(function(){
var Tributary = function() {
  var tributary = {};
  tributary.events = _.clone(Backbone.Events);
  Tributary.__events__ = _.clone(Backbone.Events);
  tributary.data = {};
  window.trib = {};
  window.trib_options = {};
  window.addEventListener("resize", function(event) {
    tributary.events.trigger("resize", event);
  });
  var mainfiles = [ "inlet.js", "inlet.coffee", "sinwaves.js", "squarecircle.js" ];
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
  tributary.make_context = function(options) {
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
    if (mainfiles.indexOf(filename) >= 0) {
      if (type === "coffee") model.set("mode", "coffeescript");
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
  Handlebars.getTemplate = function(name, callback) {
    if (Handlebars.templates === undefined || Handlebars.templates[name] === undefined) {
      $.ajax({
        url: "/static/templates/" + name + ".handlebars",
        success: function(data) {
          if (Handlebars.templates === undefined) {
            Handlebars.templates = {};
          }
          Handlebars.templates[name] = Handlebars.compile(data);
          if (callback) callback(template);
        }
      });
    }
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
    handleError: function(e) {
      tributary.__error__ = true;
      if (tributary.trace) {
        e.stack;
        console.error(e);
      }
    },
    handleNoError: function() {
      tributary.__error__ = false;
    },
    handle_coffee: function() {
      var js = this.get("code");
      if (this.get("mode") === "coffeescript") {
        js = CoffeeScript.compile(js, {
          bare: true
        });
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
      loop_type: "period",
      bv: false,
      nclones: 15,
      clone_opacity: .4,
      duration: 3e3,
      ease: "linear",
      dt: .01
    },
    require: function(callback) {
      var modules = this.get("require");
      var scripts = _.pluck(modules, "url");
      var rcb = function() {
        return callback(null, arguments);
      };
      require(scripts, rcb);
    },
    initialize: function() {
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
      var currentDisplay = this.model.get("display");
      displaySelect.selectAll("option").each(function(d, i) {
        if (this.value === currentDisplay) {
          displaySelect.node().value = this.value;
        }
      });
      var editorcontrols = d3.select(this.el).select("#logerrors").on("click", function(d) {
        var dis = d3.select(this);
        if ($(this).attr("data-name") === "log-errors") {
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
        li.append("span").text(function(d) {
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
      if (!tributary.__config__) tributary.__config__ = this.options.config;
      this.model.on("change:code", function() {
        tributary.events.trigger("warnchanged");
      }, this);
      this.config = this.options.config;
      this.config.on("change:display", this.set_display, this);
      var config = this.config;
      tributary.init = undefined;
      tributary.run = undefined;
      tributary.autoinit = config.get("autoinit");
      tributary.render = function() {};
      tributary.execute = function() {};
    },
    execute: function() {
      var js = this.model.handle_coffee();
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
        tributary.initialize(tributary.g, tributary);
        if (tributary.autoinit && tributary.init !== undefined) {
          tributary.init(tributary.g, 0);
        }
        tributary.execute();
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
      container = this.el;
      tributary.camera = new THREE.PerspectiveCamera(70, tributary.sw / tributary.sh, 1, 1e3);
      tributary.camera.position.y = 150;
      tributary.camera.position.z = 500;
      tributary.scene = new THREE.Scene;
      THREE.Object3D.prototype.clear = function() {
        var children = this.children;
        var i;
        for (i = children.length - 1; i >= 0; i--) {
          var child = children[i];
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
      controls.zoomSpeed = 1.2;
      controls.panSpeed = .8;
      controls.noZoom = false;
      controls.noPan = false;
      controls.staticMoving = false;
      controls.dynamicDampingFactor = .15;
      tributary.controls = controls;
      tributary.render = function() {
        if (tributary.useThreejsControls) {
          tributary.controls.update();
        }
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
    },
    execute: function() {
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
    },
    execute: function() {
      var js = this.model.get("code");
      if (js.length > 0) {
        var hints = JSHINT(js, {
          asi: true,
          laxcomma: true,
          laxbreak: true,
          loopfunc: true,
          smarttabs: true,
          sub: true
        });
        if (!hints) {
          this.model.trigger("jshint", JSHINT.errors);
        } else {
          this.model.trigger("nojshint");
        }
      }
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
      this.model.on("change:code", this.execute, this);
      this.model.on("change:code", function() {
        tributary.events.trigger("execute");
      });
    },
    execute: function() {
      var js = this.model.handle_coffee();
      console.log("JS", js);
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
  tributary.CSVContext = tributary.Context.extend({
    initialize: function() {
      this.model.on("change:code", this.execute, this);
      this.model.on("change:code", function() {
        tributary.events.trigger("execute");
      });
    },
    execute: function() {
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
    },
    execute: function() {
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
      this.model.on("delete", function() {
        d3.select(this.el).remove();
      }, this);
    },
    execute: function() {
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
      this.model.trigger("noerror");
      return true;
    },
    render: function() {}
  });
  tributary.make_editor = function(options) {
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
      var template = Handlebars.templates.editor;
      var html = template(this.getConfig());
      this.$el.html(html);
      filetype = that.model.get("filename").split(".")[1];
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
      this.model.on("error", function() {
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
  tributary.FilesView = Backbone.View.extend({
    initialize: function() {},
    render: function() {
      var that = this;
      var template = Handlebars.templates.files;
      var contexts = _.map(tributary.__config__.contexts, function(ctx) {
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
        var ctx = _.find(tributary.__config__.contexts, function(d) {
          return d.model.get("filename") === filename;
        });
        that.model.trigger("hide");
        ctx.model.trigger("show");
      });
      filelist.select(".delete-file").style("z-index", 1e3).on("click", function() {
        var dataset = this.parentNode.dataset;
        var filename = dataset.filename;
        var name = dataset.filename.split(".")[0];
        tributary.__config__.unset(filename);
        var context = _.find(tributary.__config__.contexts, function(d) {
          return d.model.get("filename") === filename;
        });
        context.model.trigger("delete");
        var ind = tributary.__config__.contexts.indexOf(context);
        tributary.__config__.contexts.splice(ind, 1);
        delete context;
        if (!tributary.__config__.todelete) {
          tributary.__config__.todelete = [];
        }
        tributary.__config__.todelete.push(filename);
        d3.select(that.el).selectAll("li.file").each(function() {
          if (this.dataset.filename === filename) {
            $(this).remove();
          }
        });
        var othertab = tributary.__config__.contexts[0].model;
        othertab.trigger("show");
        d3.event.stopPropagation();
      });
      var plus = d3.select(this.el).select(".add-file").on("click", function() {
        var input = d3.select(this).select("input").style("display", "inline-block");
        input.node().focus();
        input.on("keypress", function() {
          if (d3.event.charCode === 13) {
            if (input.node().value === "") {
              return input.style("display", "none");
            }
            var context = tributary.make_context({
              filename: input.node().value,
              config: tributary.__config__
            });
            if (context) {
              tributary.__config__.contexts.push(context);
              context.render();
              context.execute();
              var editor = tributary.make_editor({
                model: context.model
              });
              context.editor = editor;
              that.$el.empty();
              that.render();
              tributary.__config__.contexts.forEach(function(c) {
                c.model.trigger("hide");
              });
              context.model.trigger("show");
              editor.cm.focus();
            } else {
              input.classed("error", true);
            }
          }
        });
      });
    }
  });
  tributary.FileView = Backbone.View.extend({
    render: function() {}
  });
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
      var pluginsDiv = document.getElementById("plugins");
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
  tributary.loadPlugin = function(url, opts, onErr) {
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
        if (err) console.error(err);
        Tributary.activatePlugin(tributary, plugin.id);
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
  tributary.ui = {};
  tributary.trace = false;
  tributary.hint = false;
  var parentWindow;
  if (window) {
    window.addEventListener("message", recieveMessage, false);
    function recieveMessage(event) {
      if (event.origin !== tributary._origin || !event.data) return;
      var data = event.data;
      if (data.request === "load") {
        parentWindow = event.source;
        tributary.query = data.query;
        tributary.loadGist(data.gist, _assemble);
      } else if (data.request === "save") {
        var json = serializeGist();
        event.source.postMessage({
          request: "save",
          config: json,
          salt: data.salt
        }, event.origin);
      } else if (data.request === "description") {
        tributary.__config__.set("description", data.description);
      } else if (data.request === "exitfullscreen") {
        tributary.events.trigger("fullscreen", false);
      } else if (data.request === "thumbnail") {
        var image = data.image;
        d3.select("#trib-thumbnail").attr("src", image.data.link);
        d3.select("#trib-thumbnail").style("display", "");
        tributary.__config__.set("thumbnail", image.data.link);
      }
    }
  }
  tributary.events.on("warnchanged", function() {
    if (parentWindow) parentWindow.postMessage({
      request: "warnchanged"
    }, tributary._origin);
  });
  tributary.events.on("imgur", function(img) {
    if (parentWindow) parentWindow.postMessage({
      request: "imgur",
      img: img
    }, tributary._origin);
  });
  function goFullscreen() {
    if (parentWindow) parentWindow.postMessage({
      request: "fullscreen"
    }, tributary._origin);
  }
  tributary.ui.setup = function() {
    tributary.events.on("resize", function() {
      if ($("#display").width() > 767) {
        tributary.sw = $("#display").width() - $("#panel").width();
      } else {
        tributary.sw = $("#display").width();
      }
      if ($("#container").hasClass("fullscreen")) {
        tributary.sw = $("#display").width();
      }
      tributary.sh = $("#display").height();
      tributary.events.trigger("execute");
    });
    tributary.events.trigger("resize");
  };
  function _assemble(error, ret) {
    if (error) {
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
      context = tributary.make_context({
        config: config,
        model: m,
        display: d3.select("#display")
      });
      if (context) {
        config.contexts.push(context);
        context.render();
        if (mainfiles.indexOf(m.get("filename")) < 0) {
          context.execute();
        }
        context.editor = tributary.make_editor({
          model: m,
          parent: edit
        });
        m.trigger("hide");
      }
    });
    config.contexts.forEach(function(c) {
      if (mainfiles.indexOf(c.model.get("filename")) >= 0) {
        c.model.trigger("show");
        tributary.autoinit = true;
        c.execute();
        tributary.autoinit = config.get("autoinit");
      }
    });
    var files_view = new tributary.FilesView({
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
      console.log("fullscreen!", fullscreen);
      if (fullscreen) {
        config.set("fullscreen", true);
        $("#container").addClass("fullscreen");
        goFullscreen();
        tributary.events.trigger("resize");
      } else {
        config.set("fullscreen", false);
        $("#container").removeClass("fullscreen");
        tributary.events.trigger("resize");
      }
    }
    $("#fullscreen").on("click", function() {
      fullscreenEvent(true);
    });
    tributary.events.on("fullscreen", fullscreenEvent);
    tributary.events.trigger("fullscreen", config.get("fullscreen"));
    tributary.events.trigger("loaded");
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
  return tributary;
};