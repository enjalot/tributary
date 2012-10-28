//(function(){
var Tributary = function() {
  var tributary = {};
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
      mode: "javascript",
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
      display: "svg",
      "public": true,
      require: [],
      tab: "edit",
      display_percent: .7,
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
      var displays = d3.select(this.el).append("div").classed("displaycontrols", true).selectAll("div.config").data(tributary.displays).enter().append("div").classed("config", true);
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
        tributary.events.trigger("execute");
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
      var requireUI = d3.select(this.el).append("div").attr("id", "require-ui");
      requireUI.append("span").classed("config_title", true).text("Require:");
      var rc = requireUI.append("div").classed("requirecontrols", true);
      var rcs = rc.selectAll("div.config").data(this.model.get("require")).enter().append("div").classed("config", true);
      rcs.append("span").text(function(d) {
        return d.name;
      });
      rcs.append("span").text(function(d) {
        return " " + d.url;
      }).classed("description", true);
      rcs.append("span").text("x").classed("delete", true).on("click", function(d) {
        var reqs = that.model.get("require");
        var ind = reqs.indexOf(d);
        reqs.splice(ind, 1);
        that.model.set("require", reqs);
        that.$el.empty();
        that.render();
      });
      var plus = rc.append("div").classed("config", true);
      plus.append("span").text("+ ");
      var name_input = plus.append("div").text("name: ").style({
        display: "none"
      });
      name_input.append("input").attr({
        type: "text"
      });
      var url_input = plus.append("div").text("url: ").style({
        display: "none"
      });
      url_input.append("input").text("url:").attr({
        type: "text"
      });
      plus.on("click", function() {
        name_input.style("display", "");
        url_input.style("display", "");
        name_input.select("input").node().focus();
        var done = function() {
          var req = {
            name: name_input.select("input").node().value,
            url: url_input.select("input").node().value
          };
          var reqs = that.model.get("require");
          reqs.push(req);
          that.model.set("require", reqs);
          that.$el.empty();
          console.log(that);
          that.render();
        };
        name_input.on("keypress", function() {
          if (d3.event.charCode === 13) {
            done();
          }
        });
        url_input.on("keypress", function() {
          if (d3.event.charCode === 13) {
            done();
          }
        });
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
      tributary.dt = config.get("dt");
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
        if (tributary.loop) {
          if (tributary.reverse) {
            dt = tributary.timer.ctime * dtime / tributary.timer.duration * -1;
          } else {
            dt = (1 - tributary.timer.ctime) * dtime / tributary.timer.duration;
          }
          tributary.t = tributary.timer.ctime + dt;
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
        } else {
          tributary.t += tributary.dt;
        }
        tributary.execute();
        config.trigger("tick", tributary.t);
      });
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
        window.trib = {};
        window.trib_options = {};
        trib = window.trib;
        trib_options = window.trib_options;
        if (tributary.autoinit) {
          tributary.clear();
        }
        if (this.clones) {
          $(this.clones.node()).empty();
        }
        if (tributary.bv) {
          this.make_clones();
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
      try {
        eval(this.model.get("code"));
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
  tributary.CSSContext = tributary.Context.extend({
    initialize: function() {
      this.model.on("change:code", this.execute, this);
      this.model.on("change:code", function() {
        tributary.events.trigger("execute");
      });
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
      console.log("style el", this.el);
    }
  });
  tributary.HTMLContext = tributary.Context.extend({
    initialize: function() {
      this.model.on("change:code", this.execute, this);
      this.model.on("change:code", function() {
        tributary.events.trigger("execute");
      });
    },
    execute: function() {
      try {
        $(this.el).html(this.model.get("code"));
      } catch (e) {
        this.model.trigger("error", e);
        return false;
      }
      this.model.trigger("noerror");
      return true;
    },
    render: function() {
      this.el = d3.select("body").selectAll("div.htmlcontext").data([ this.model ], function(d) {
        return d.cid;
      }).enter().append("div").classed("htmlcontext", true).node();
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
      d3.select(this.el).classed("editor", true);
      this.cm = CodeMirror(this.el, {
        mode: that.model.get("mode"),
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
    var url = "https://api.github.com/gists/" + id + cachebust;
    $.ajax({
      url: url,
      success: handle_gist,
      error: function(e) {
        console.log(e);
        url = "/gist/" + id + cachebust;
        $.ajax({
          url: url,
          success: handle_gist,
          error: function(er) {
            console.log(er);
          }
        });
      }
    });
    function handle_gist(data) {
      ret.gist = data;
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
    }
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
      var plus = d3.select(this.el).append("div").classed("fv", true);
      plus.append("span").text("+");
      var input = plus.append("input").attr({
        type: "text"
      }).style({
        display: "none"
      });
      plus.on("click", function() {
        input.style("display", "inline-block");
        input.node().focus();
        input.on("keypress", function() {
          if (d3.event.charCode === 13) {
            var context = tributary.make_context({
              filename: input.node().value,
              config: that.model
            });
            if (context) {
              that.model.contexts.push(context);
              context.render();
              context.execute();
              tributary.make_editor({
                model: context.model
              });
              that.$el.empty();
              that.render();
            } else {
              input.classed("input_error", true);
            }
          }
        });
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
          tributary.initialize(tributary.g, tributary);
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
    if (mainfiles.indexOf(filename) >= 0) {
      context = new tributary.TributaryContext({
        config: config,
        model: model,
        el: display.node()
      });
    } else if (type === "json") {
      context = new tributary.JSONContext({
        config: config,
        model: model
      });
    } else if (type === "csv") {
      context = new tributary.CSVContext({
        config: config,
        model: model
      });
    } else if (type === "js") {
      context = new tributary.JSContext({
        config: config,
        model: model
      });
    } else if (type === "css") {
      context = new tributary.CSSContext({
        config: config,
        model: model
      });
    } else if (type === "html") {} else {}
    return context;
  };
  tributary.make_editor = function(options) {
    var model = options.model;
    if (options.container) {
      container = options.container;
    } else {
      container = tributary.edit.append("div").attr("id", model.cid);
    }
    var editor;
    editor = new tributary.Editor({
      el: container.node(),
      model: model
    });
    editor.render();
    return editor;
  };
  d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
      this.parentNode.appendChild(this);
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
  tributary.ui = {};
  var mainfiles = [ "inlet.js", "sinwaves.js", "squarecircle.js" ];
  var display, panel_gui, panel, panel_handle, page, header;
  tributary.ui.setup = function() {
    display = d3.select("#display");
    panel_gui = d3.select("#panel_gui");
    panel = d3.select("#panel");
    panel_handle = d3.select("#panel_handle");
    panelfile_gui = d3.select("#panelfiles_gui");
    page = d3.select("#page");
    header = d3.select("#header");
    tributary.dims = {
      display_percent: .7,
      page_width: 0,
      page_height: 0,
      display_width: 0,
      display_height: 0,
      panel_width: 0,
      panel_height: 0,
      panel_gui_width: 0,
      panel_gui_height: 31,
      panelfiles_gui_height: 31
    };
    tributary.events.on("resize", function() {
      var min_width = parseInt(panel.style("min-width"), 10);
      tributary.dims.page_width = parseInt(page.style("width"), 10);
      if (tributary.dims.page_width - tributary.dims.page_width * tributary.dims.display_percent < min_width) {
        return;
      }
      tributary.dims.display_width = tributary.dims.page_width * tributary.dims.display_percent;
      tributary.dims.panel_width = tributary.dims.page_width - tributary.dims.display_width;
      tributary.dims.panel_gui_width = tributary.dims.panel_width;
      tributary.dims.page_height = parseInt(page.style("height"), 10);
      tributary.dims.display_height = tributary.dims.page_height - parseInt(header.style("height"), 10);
      tributary.dims.panel_height = tributary.dims.display_height - (tributary.dims.panel_gui_height + tributary.dims.panelfiles_gui_height);
      display.style("width", tributary.dims.display_width + "px");
      panel.style("width", tributary.dims.panel_width + "px");
      panel_gui.style("width", tributary.dims.panel_gui_width + "px");
      panelfile_gui.style("width", tributary.dims.panel_gui_width + "px");
      panel.style("height", tributary.dims.panel_height + "px");
      display.style("height", tributary.dims.display_height + "px");
      panel_gui.style("height", tributary.dims.panel_gui_height + "px");
      panel_handle.style("right", tributary.dims.panel_width + "px");
      tributary.sw = tributary.dims.display_width;
      tributary.sh = tributary.dims.display_height;
      tributary.events.trigger("execute");
    });
    tributary.events.trigger("resize");
    var ph_drag = d3.behavior.drag().on("drag", function() {
      var dx = d3.event.dx / tributary.dims.page_width;
      if (tributary.dims.display_percent + dx >= 0 && tributary.dims.display_percent + dx <= 1) {
        tributary.dims.display_percent += dx;
      }
      tributary.events.trigger("resize");
    });
    panel_handle.call(ph_drag);
    var panel_data = [ "edit", "config" ];
    var pb_w = 60;
    var panel_buttons = panel_gui.selectAll("div.pb").data(panel_data).enter().append("div").classed("pb", true).attr({
      id: function(d) {
        return d + "_tab";
      }
    }).on("click", function(d) {
      tributary.events.trigger("show", d);
    }).text(function(d) {
      return d;
    });
    tributary.events.on("show", function(name) {
      $("#panel").children("div").css("display", "none");
      panel.select("#" + name).style("display", "");
      panel_gui.selectAll("div.pb").classed("gui_active", false);
      panel_gui.select("#" + name + "_tab").classed("gui_active", true);
    });
    tributary.events.trigger("show", "edit");
    $("#hide-panel-button").on("click", function() {
      tributary.events.trigger("hidepanel");
      $("#display").addClass("fullscreen");
      $("svg").addClass("fullscreen");
      $("#header").addClass("dimheader");
    });
    $("#show-codepanel-button").on("click", function() {
      tributary.events.trigger("showpanel");
      $("#display").removeClass("fullscreen");
      $("svg").removeClass("fullscreen");
      $("#header").removeClass("dimheader");
    });
    tributary.events.on("hidepanel", function() {
      $("#panel").hide();
      $("#panel_gui").hide();
      $("#panel_handle").hide();
      $("#panelfiles_gui").hide();
      $("#show-codepanel").show();
    });
    tributary.events.on("showpanel", function() {
      $("#panel").show();
      $("#panel_gui").show();
      $("#panel_handle").show();
      $("#panelfiles_gui").show();
      $("#show-codepanel").hide();
    });
  };
  tributary.ui.assemble = function(gistid) {
    tributary.trace = true;
    if (gistid.length > 0) {
      tributary.gist(gistid, _assemble);
    } else {
      var ret = {};
      ret.config = new tributary.Config;
      ret.models = new tributary.CodeModels(new tributary.CodeModel);
      _assemble(ret);
    }
  };
  function _assemble(ret) {
    var config = ret.config;
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
    var edit = panel.select("#edit");
    tributary.edit = edit;
    ret.models.each(function(m) {
      type = m.get("type");
      context = tributary.make_context({
        config: config,
        model: m,
        display: display
      });
      if (context) {
        config.contexts.push(context);
        context.render();
        if (mainfiles.indexOf(m.get("filename")) >= 0) {
          context.execute();
        }
        tributary.make_editor({
          model: m
        });
      }
    });
    config.contexts.forEach(function(c) {
      if (mainfiles.indexOf(c.model.get("filename")) >= 0) {
        tributary.autoinit = true;
        c.execute();
        tributary.autoinit = config.get("autoinit");
      }
    });
    var config_view = new tributary.ConfigView({
      el: "#config",
      model: config
    });
    config_view.render();
    var files_view = new tributary.FilesView({
      el: "#files",
      model: config
    });
    files_view.render();
    var controls_view = new tributary.ControlsView({
      el: "#controls",
      model: config
    });
    controls_view.render();
    setup_header(ret);
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
  function setup_header(ret) {
    setup_save(ret.config);
    if (ret.user) {
      var gist_uid = ret.user.userid;
      var info_string = '"<a href="' + ret.gist.html_url + '">' + ret.gist.description + '</a>" by ';
      if (ret.user.url === "") {
        info_string += ret.user.login;
      } else {
        info_string += '<a href="' + ret.user.url + '">' + ret.user.login + "</a>";
      }
      $("#gist_info").html(info_string);
      if (ret.user.id !== tributary.userid) {
        $("#savePanel").attr("disabled", "true");
        $("#savePanel").attr("class", "off");
      }
    }
    if (isNaN(tributary.userid)) {
      $("#savePanel").attr("disabled", "true");
      $("#savePanel").attr("class", "off");
    }
  }
  function setup_save(config) {
    $("#savePanel").on("click", function(e) {
      d3.select("#syncing").style("display", "block");
      tributary.save_gist(config, "save", function(newurl, newgist) {
        window.location = newurl;
      });
    });
    $("#forkPanel").on("click", function(e) {
      d3.select("#syncing").style("display", "block");
      tributary.save_gist(config, "fork", function(newurl, newgist) {
        window.location = newurl;
      });
    });
    $("#loginPanel").on("click", function(e) {
      tributary.login_gist(tributary.loggedin, function(newurl, newgist) {
        window.location = newurl;
      });
    });
  }
  return tributary;
};