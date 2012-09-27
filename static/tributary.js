(function() {
  var tributary = {};
  window.tributary = tributary;
  window.trib = {};
  window.trib_options = {};
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
        console.error(e);
      }
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
  tributary.CodeModels = Backbone.Model.extend({
    model: tributary.CodeModel
  });
  tributary.Config = Backbone.Model.extend({
    defaults: {
      endpoint: "tributary",
      "public": true
    }
  });
  tributary.Context = Backbone.View.extend({
    initialize: function() {},
    render: function() {}
  });
  tributary.JSONContext = Backbone.View.extend({
    initialize: function() {
      this.model.on("code", this.execute);
    },
    execute: function() {
      try {
        var json = JSON.parse(this.get("code"));
        tributary[this.get("name")] = json;
      } catch (e) {
        this.trigger("error", e);
        return false;
      }
      this.trigger("noerror");
      return true;
    },
    render: function() {}
  });
  tributary.EditorView = Backbone.View.extend({
    initialize: function() {
      this.config = this.model.get("config");
    },
    render: function() {
      var that = this;
      console.log("editor el", this.el);
      this.cm = CodeMirror(this.el, {
        mode: "javascript",
        theme: "lesser-dark",
        lineNumbers: true,
        onChange: function() {
          var code = cm.getValue();
          if (that.config.coffee) {
            code = CoffeeScript.compile(code, {
              bare: true
            });
          }
          that.model.trigger("code", code);
        }
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
      var fsplit, model, context, i = 0, ext;
      files.forEach(function(f) {
        fsplit = f.split(".");
        ext = fsplit[fsplit.length - 1];
        if (f !== "config.json") {
          model = new tributary.CodeModel({
            filename: f,
            name: fsplit[0],
            code: data.files[f].content,
            type: ext,
            config: ret.config.toJSON()
          });
        }
      });
      callback(ret);
    });
  };
  tributary.DeltaContext = Backbone.View.extend({
    initialize: function() {},
    render: function() {}
  });
})();