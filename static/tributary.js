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
      require: [],
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
      ease: "linear"
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
      tcs.each(function(d) {
        if (that.model.get(d.name)) {
          d3.select(this).classed("config_active", true);
        }
      });
      tcs.append("span").text(function(d) {
        return d.name;
      });
      tcs.append("span").text(function(d) {
        return " " + d.description;
      }).classed("description", true);
      tcs.on("click", function(d) {
        var tf = !that.model.get(d.name);
        d3.select(this).classed("config_active", tf);
        that.model.set(d.name, tf);
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
      var config = this.config;
      tributary.init = undefined;
      tributary.run = undefined;
      tributary.loop = config.get("loop");
      tributary.autoinit = config.get("autoinit");
      tributary.pause = config.get("pause");
      tributary.loop_type = config.get("loop_type");
      tributary.bv = config.get("bv");
      tributary.nclones = config.get("nclones");
      tributary.clone_opacity = config.get("clone_opacity");
      tributary.duration = config.get("duration");
      tributary.ease = d3.ease(config.get("ease"));
      tributary.t = 0;
      tributary.reverse = false;
      tributary.render = function() {};
      tributary.execute = function() {
        if (tributary.run !== undefined) {
          var t = tributary.t;
          if (tributary.loop) {
            t = tributary.ease(tributary.t);
          }
          tributary.run(tributary.g, t, 0);
        }
      };
      tributary.timer = {
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
        var dtime = now - tributary.timer.then;
        var dt;
        if (tributary.reverse) {
          dt = tributary.timer.ctime * dtime / tributary.timer.duration * -1;
        } else {
          dt = (1 - tributary.timer.ctime) * dtime / tributary.timer.duration;
        }
        tributary.t = tributary.timer.ctime + dt;
        if (tributary.loop) {
          if (tributary.t >= 1 || tributary.t <= 0 || tributary.t === "NaN") {
            if (tributary.loop_type === "period") {
              tributary.t = 0;
              tributary.timer.then = new Date;
              tributary.timer.duration = tributary.duration;
              tributary.timer.ctime = tributary.t;
              tributary.reverse = false;
            } else if (tributary.loop_type === "pingpong") {
              tributary.t = !tributary.reverse;
              tributary.timer.then = new Date;
              tributary.timer.duration = tributary.duration;
              tributary.timer.ctime = tributary.t;
              tributary.reverse = !tributary.reverse;
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
        }
        tributary.execute();
        config.trigger("tick", tributary.t);
      });
    },
    execute: function() {
      var js = this.model.handle_coffee();
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
      tributary.g = this.svg;
      tributary.clear = function() {
        $(tributary.g.node()).empty();
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
    make_clones: function() {
      this.clones = this.svg.selectAll("g.clones").data([ 0 ]);
      this.clones.enter().append("g").attr("class", "clones");
      tributary.g = this.svg.selectAll("g.delta").data([ 0 ]);
      tributary.g.enter().append("g").attr("class", "delta");
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
    tributary.gistid = id;
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
  tributary.save_gist = function(config, saveorfork, callback) {
    var oldgist = tributary.gistid || "";
    var gist = {
      description: "just another inlet to tributary",
      "public": config.get("public"),
      files: {}
    };
    config.contexts.forEach(function(context) {
      gist.files[context.model.get("filename")] = {
        content: context.model.get("code")
      };
    });
    gist.files["config.json"] = {
      content: JSON.stringify(config.toJSON())
    };
    if (config.display === "svg") {
      var node = d3.select("svg").node();
      var svgxml = (new XMLSerializer).serializeToString(node);
      if ($.browser.webkit) {
        svgxml = svgxml.replace(/ xlink/g, " xmlns:xlink");
        svgxml = svgxml.replace(/ href/g, " xlink:href");
      }
      gist.files["inlet.svg"] = {
        content: svgxml
      };
    }
    var url;
    if (saveorfork === "save") {
      url = "/tributary/save";
    } else if (saveorfork === "fork") {
      url = "/tributary/fork";
    }
    if (oldgist.length > 4) {
      url += "/" + oldgist;
    }
    var that = this;
    $.post(url, {
      gist: JSON.stringify(gist)
    }, function(data) {
      if (typeof data === "string") {
        data = JSON.parse(data);
      }
      var newgist = data.id;
      var newurl = "/tributary/" + newgist;
      callback(newurl, newgist);
    });
  };
  tributary.login_gist = function(loginorout, callback) {
    var url;
    if (loginorout) {
      url = "/github-logout";
    } else {
      url = "/github-login";
    }
    url += "/tributary";
    if (tributary.gistid) {
      url += "/" + tributary.gistid;
    }
    callback(url);
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
    initialize: function() {
      this.model.on("change:play", this.play_button, this);
      this.model.on("change:loop", this.time_slider, this);
      this.model.on("change:restart", this.restart_button, this);
    },
    render: function() {
      var del = d3.select(this.el);
      del.append("div").attr("id", "time_controls");
      del.append("div").attr("id", "user_controls");
      del.append("div").attr("id", "time_options");
      this.play_button();
      this.time_slider();
      this.restart_button();
    },
    play_button: function() {
      var tc = d3.select(this.el).select("#time_controls");
      if (this.model.get("play")) {
        var pb = tc.append("button").classed("play", true).classed("button_on", true).text("Play");
        pb.on("click", function(event) {
          if (!tributary.pause) {
            pb.classed("playing", false);
            pb.text("Play");
          } else if (tributary.pause) {
            pb.classed("playing", true);
            pb.text("Pause");
          }
          if (tributary.t < 1 || !tributary.loop) {
            tributary.pause = !tributary.pause;
            if (!tributary.pause) {
              tributary.timer.then = new Date;
              tributary.timer.duration = (1 - tributary.t) * tributary.duration;
              tributary.timer.ctime = tributary.t;
            }
          }
        });
      } else {
        tc.select("button.play").remove();
      }
    },
    time_slider: function() {
      tributary.loop = this.model.get("loop");
      var tc = d3.select(this.el).select("#time_controls");
      if (tributary.loop) {
        var ts = tc.append("input").attr({
          type: "range",
          min: 0,
          max: 1,
          step: .01,
          value: 0,
          name: "time"
        }).classed("time_slider", true);
        $(ts.node()).on("change", function() {
          tributary.t = parseFloat(this.value);
          if (tributary.pause) {
            tributary.execute();
          }
        });
        this.model.on("tick", function(t) {
          $(ts.node()).attr("value", tributary.t);
        });
        if (this.model.get("display") === "svg") {
          var bv = tc.append("button").classed("bv", true).classed("button_on", true).text("BV");
          bv.on("click", function() {
            tributary.bv = !tributary.bv;
            tributary.events.trigger("execute");
          });
        }
      } else {
        tributary.bv = false;
        tc.select("input.time_slider").remove();
        tc.select("button.bv").remove();
      }
    },
    restart_button: function() {
      var that = this;
      var tc = d3.select(this.el).select("#time_controls");
      if (this.model.get("restart")) {
        tributary.autoinit = false;
        var rb = tc.append("button").classed("restart", true).classed("button_on", true).text("Restart");
        rb.on("click", function(event) {
          tributary.clear();
          tributary.init(tributary.g);
          tributary.execute();
        });
      } else {
        tributary.autoinit = true;
        tc.select("button.restart").remove();
      }
    }
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