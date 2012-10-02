(function() {
  var tributary = {};
  window.tributary = tributary;
  tributary.events = _.clone(Backbone.Events);
  tributary.data = {};
  window.trib = {};
  window.trib_options = {};
  window.addEventListener("resize", function(event) {
    tributary.events.trigger("resize", event);
  });
  tributary.CodeModel = Backbone.Model.extend({
    defaults: {
      code: "",
      filename: "inlet.js",
      name: "inlet",
      type: "js",
      config: {
        coffee: false,
        vim: false,
        emacs: false,
        hide: false
      }
    },
    initialize: function() {
      this.binder();
    },
    binder: function() {
      this.on("error", this.handle_error);
    },
    handle_error: function(e) {
      if (tributary.trace) {
        console.trace();
        console.log(e);
      }
    },
    handle_coffee: function() {
      var js = this.get("code");
      if (this.get("config").coffee) {
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
      endpoint: "tributary",
      "public": true,
      require: []
    },
    require: function(callback, ret) {
      var modules = this.get("require");
      var scripts = _.pluck(modules, "url");
      var rcb = function() {
        return callback(ret, arguments);
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
    render: function() {
      var that = this;
      d3.select(this.el).append("span").classed("config_title", true).text("Display:");
      var displays = d3.select(this.el).append("div").classed("displays", true).selectAll("div.config").data(tributary.displays).enter().append("div").classed("config", true);
      var initdisplay = this.model.get("display");
      displays.each(function(d) {
        console.log(d.name, initdisplay);
        if (d.name === initdisplay) {
          d3.select(this).classed("config_active", true);
        }
      });
      displays.append("span").text(function(d) {
        return d.name;
      });
      displays.append("span").text(function(d) {
        return " " + d.description;
      }).classed("description", true);
      displays.on("click", function(d) {
        d3.select(this.parentNode).selectAll("div.config").classed("config_active", false);
        d3.select(this).classed("config_active", true);
        that.model.set("display", d.name);
      });
      d3.select(this.el).append("span").classed("config_title", true).text("Time Controls:");
      var tcs = d3.select(this.el).append("div").classed("timecontrols", true).selectAll("div.config").data(tributary.time_controls).enter().append("div").classed("config", true);
      tcs.each(function(d) {});
      tcs.append("span").text(function(d) {
        return d.name;
      });
      tcs.append("span").text(function(d) {
        return " " + d.description;
      }).classed("description", true);
      tcs.on("click", function(d) {
        d3.select(this).classed("config_active", !d3.select(this).classed("config_active"));
      });
    }
  });
  tributary.Context = Backbone.View.extend({
    initialize: function() {},
    execute: function() {},
    render: function() {}
  });
  tributary.TributaryContext = tributary.Context.extend({
    initialize: function() {
      this.model.on("change:code", this.execute, this);
      tributary.events.on("execute", this.execute, this);
      this.config = this.options.config;
      this.config.on("change:display", this.set_display, this);
      tributary.init = undefined;
      tributary.run = undefined;
      tributary.pause = true;
      tributary.reverse = false;
      tributary.loop = "period";
      tributary.bv = false;
      tributary.nclones = 15;
      tributary.clone_opacity = .4;
      tributary.duration = 3e3;
      tributary.t = 0;
      tributary.ease = d3.ease("linear");
      tributary.render = function() {};
      var that = this;
      that.timer = {
        then: new Date,
        duration: tributary.duration,
        ctime: tributary.t
      };
      d3.timer(function() {
        tributary.render();
        if (tributary.pause) {
          return false;
        }
        var now = new Date;
        var dtime = now - that.timer.then;
        var dt;
        if (that.reverse) {
          dt = that.timer.ctime * dtime / that.timer.duration * -1;
        } else {
          dt = (1 - that.timer.ctime) * dtime / that.timer.duration;
        }
        tributary.t = that.timer.ctime + dt;
        if (tributary.loops) {
          if (tributary.t >= 1 || tributary.t <= 0 || tributary.t === "NaN") {
            if (that.loop === "period") {
              tributary.t = 0;
              that.timer.then = new Date;
              that.timer.duration = tributary.duration;
              that.timer.ctime = tributary.t;
              that.reverse = false;
            } else if (that.loop === "pingpong") {
              tributary.t = !that.reverse;
              that.timer.then = new Date;
              that.timer.duration = tributary.duration;
              that.timer.ctime = tributary.t;
              that.reverse = !that.reverse;
            } else {
              if (tributary.t !== 0) {
                tributary.t = 1;
                tributary.pause = true;
              }
            }
          }
          if (tributary.t === true) {
            tributary.t = 1;
          }
          if (tributary.t === false) {
            tributary.t = 0;
          }
          $("#slider").attr("value", tributary.t);
        }
        if (tributary.run !== undefined) {
          var t = tributary.t;
          if (tributary.loops) {
            t = tributary.ease(tributary.t);
          }
          tributary.run(that.g, t, 0);
        }
      });
    },
    execute: function() {
      var js = this.model.handle_coffee();
      var that = this;
      try {
        eval(js);
      } catch (e) {
        this.model.trigger("error", e);
        return false;
      }
      try {
        window.trib = {};
        window.trib_options = {};
        trib = window.trib;
        trib_options = window.trib_options;
        tributary.clear();
        if (this.clones) {
          $(this.clones.node()).empty();
        }
        if (tributary.bv) {
          this.make_clones();
        }
        eval(js);
        if (tributary.autoinit && tributary.init !== undefined) {
          tributary.init(this.g, 0);
        }
        if (tributary.run !== undefined) {
          tributary.run(this.g, tributary.ease(tributary.t), 0);
        }
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
      this.$el.empty();
      var display = this.config.get("display");
      if (display === "svg") {
        this.make_svg();
      } else if (display === "canvas") {
        this.make_canvas();
      } else if (display === "webgl") {
        this.make_webgl();
      } else if (display === "div") {
        tributary.clear = function() {
          this.$el.empty();
        };
      } else {
        tributary.clear = function() {
          this.$el.empty();
        };
      }
    },
    make_svg: function() {
      this.svg = d3.select(this.el).append("svg").attr({
        xmlns: "http://www.w3.org/2000/svg",
        xlink: "http://www.w3.org/1999/xlink",
        "class": "tributary_svg"
      });
      this.g = this.svg;
      var that = this;
      tributary.clear = function() {
        $(that.g.node()).empty();
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
      this.g = tributary.ctx;
    },
    make_clones: function() {
      this.clones = this.svg.selectAll("g.clones").data([ 0 ]);
      this.clones.enter().append("g").attr("class", "clones");
      this.g = this.svg.selectAll("g.delta").data([ 0 ]);
      this.g.enter().append("g").attr("class", "delta");
      var frames = d3.range(tributary.nclones);
      var gf = this.clones.selectAll("g.bvclone").data(frames).enter().append("g").attr("class", "bvclone").style("opacity", tributary.clone_opacity);
      gf.each(function(d, i) {
        var j = i + 1;
        var frame = d3.select(this);
        tributary.init(frame, j);
        var t = tributary.ease(j / (tributary.nclones + 1));
        tributary.run(frame, t, j);
      });
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
        console.log("execute???");
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
  tributary.DeltaContext = Backbone.View.extend({
    initialize: function() {
      this.model.on("change:code", this.execute, this);
      this.pause = true;
      this.reverse = false;
      this.loop = "period";
      this.bv = false;
      this.nclones = 15;
      this.clonse_opacity = .4;
      this.duration = 3e3;
      this.t = 0;
      this.ease = d3.ease("linear");
      tributary.init = function(g, t, i) {};
      tributary.run = function(g, t, i) {};
      var that = this;
      that.timer = {
        then: new Date,
        duration: that.duration,
        ctime: that.t
      };
      d3.timer(function() {
        if (that.pause) {
          return false;
        }
        var now = new Date;
        var dtime = now - that.timer.then;
        var dt;
        if (that.reverse) {
          dt = that.timer.ctime * dtime / that.timer.duration * -1;
        } else {
          dt = (1 - that.timer.ctime) * dtime / that.timer.duration;
        }
        that.t = that.timer.ctime + dt;
        if (that.t >= 1 || that.t <= 0 || that.t === "NaN") {
          if (that.loop === "period") {
            that.t = 0;
            that.timer.then = new Date;
            that.timer.duration = that.duration;
            that.timer.ctime = that.t;
            that.reverse = false;
          } else if (that.loop === "pingpong") {
            that.t = !that.reverse;
            that.timer.then = new Date;
            that.timer.duration = that.duration;
            that.timer.ctime = that.t;
            that.reverse = !that.reverse;
          } else {
            if (that.t !== 0) {
              that.t = 1;
              that.pause = true;
            }
          }
        }
        if (that.t === true) {
          that.t = 1;
        }
        if (that.t === false) {
          that.t = 0;
        }
        $("#slider").attr("value", that.t);
        tributary.run(that.g, that.ease(that.t), 0);
      });
    },
    execute: function() {
      var js = this.model.handle_coffee();
      try {
        tributary.initialize = new Function("g", js);
        tributary.initialize();
      } catch (e) {
        this.model.trigger("error", e);
        return false;
      }
      if (tributary.bv) {
        try {
          $(this.clones.node()).empty();
          this.make_clones();
        } catch (er) {
          this.model.trigger("error", er);
        }
      }
      try {
        window.trib = {};
        window.trib_options = {};
        trib = window.trib;
        trib_options = window.trib_options;
        $(this.g.node()).empty();
        tributary.init(this.g, 0);
        tributary.run(this.g, this.ease(this.t), 0);
      } catch (err) {
        this.model.trigger("error", err);
        return false;
      }
      this.model.trigger("noerror");
      return true;
    },
    render: function() {
      this.svg = d3.select(this.el).append("svg").attr({
        xmlns: "http://www.w3.org/2000/svg",
        xlink: "http://www.w3.org/1999/xlink",
        "class": "tributary_svg"
      });
      this.clones = this.svg.append("g").attr("id", "clones");
      this.g = this.svg.append("g").attr("id", "delta");
    },
    make_clones: function() {
      var frames = d3.range(this.nclones);
      var gf = this.clones.selectAll("g.bvclone").data(frames).enter().append("g").attr("class", "bvclone").style("opacity", this.clone_opacity);
      gf.each(function(d, i) {
        var j = i + 1;
        var frame = d3.select(this);
        tributary.init(frame, j);
        var t = this.ease(j / (this.nclones + 1));
        tributary.run(frame, t, j);
      });
    }
  });
  tributary.Editor = Backbone.View.extend({
    initialize: function() {
      this.config = this.model.get("config");
      this.model.on("show", function() {
        d3.select(this.el).style("display", "");
      }, this);
      this.model.on("hide", function() {
        d3.select(this.el).style("display", "none");
      }, this);
    },
    render: function() {
      var that = this;
      d3.select(this.el).attr({
        "class": "editor"
      });
      this.cm = CodeMirror(this.el, {
        mode: "javascript",
        theme: "lesser-dark",
        lineNumbers: true,
        onChange: function() {
          var code = that.cm.getValue();
          that.model.set("code", code);
        }
      });
      this.cm.setValue(this.model.get("code"));
      this.inlet = Inlet(this.cm);
      this.model.on("error", function() {
        d3.select(that.el).select(".CodeMirror-gutter").classed("error", true);
      });
      this.model.on("noerror", function() {
        d3.select(that.el).select(".CodeMirror-gutter").classed("error", false);
      });
    }
  });
  tributary.gist = function(id, callback) {
    var ret = {};
    var cachebust = "?cachebust=" + Math.random() * 0xf12765df4c9b2;
    d3.json("https://api.github.com/gists/" + id + cachebust, function(data) {
      if (data.user === null || data.user === undefined) {
        ret.user = {
          login: "anon",
          url: "",
          userid: -1
        };
      } else {
        ret.user = data.user;
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
      });
      ret.config.require(callback, ret);
    });
  };
  tributary.FilesView = Backbone.View.extend({
    initialize: function() {},
    render: function() {
      var that = this;
      var fvs = d3.select(this.el).selectAll("div").data(this.model.contexts);
      var fv = fvs.enter().append("div").classed("fv", true);
      fv.on("click", function(d) {
        that.model.trigger("hide");
        d.model.trigger("show");
        tributary.events.trigger("show", "edit");
      });
      fv.append("span").text(function(d) {
        return d.model.get("filename");
      });
    }
  });
  tributary.FileView = Backbone.View.extend({
    render: function() {}
  });
  tributary.ControlsView = Backbone.View.extend({
    initialize: function() {},
    render: function() {}
  });
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
    name: "div",
    description: "gives you a plain old <div>"
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
  d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
      this.parentNode.appendChild(this);
    });
  };
})();