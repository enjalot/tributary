var getLocalStorageValue, setLocalStorageValue;
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
  for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
  function ctor() { this.constructor = child; }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor;
  child.__super__ = parent.prototype;
  return child;
};
getLocalStorageValue = function(key) {
  var localStorageKey;
  localStorageKey = 'tributary/';
  return localStorage.getItem([localStorageKey, key].join('/'));
};
setLocalStorageValue = function(key, value) {
  var localStorageKey;
  localStorageKey = 'tributary/';
  return localStorage.setItem([localStorageKey, key].join('/'), value);
};
tributary.Tributary = (function() {
  __extends(Tributary, Backbone.Model);
  function Tributary() {
    this.get_code = __bind(this.get_code, this);
    this.newcode = __bind(this.newcode, this);
    this.execute = __bind(this.execute, this);
    Tributary.__super__.constructor.apply(this, arguments);
  }
  Tributary.prototype.defaults = {
    code: ""
  };
  Tributary.prototype.initialize = function() {
    this.on("code", this.newcode);
    return this.on("execute", this.execute);
  };
  Tributary.prototype.execute = function() {
    var code, svg;
    $("svg").empty();
    delete tributary.initialize;
    try {
      svg = d3.select("svg");
      code = "tributary.initialize = function(g) {";
      code += this.get("code");
      code += "};";
      eval(code);
      tributary.initialize(d3.select("svg"));
    } catch (_e) {}
    return true;
  };
  Tributary.prototype.newcode = function(code) {
    this.set({
      code: code
    });
    this.execute();
    return true;
  };
  Tributary.prototype.get_code = function(callback) {
    var src_url;
    if (this.get("gist") && this.get("filename")) {
      src_url = "/tributary/api/" + this.get("gist") + "/" + this.get("filename");
      return d3.text(src_url, __bind(function(data) {
        var code;
        if (data) {
          code = data;
          this.set({
            code: data
          });
        } else {
          code = this.get("code");
          console.log("codeee?", code);
          if (!code) {
            code = "";
          }
        }
        return callback(null, code);
      }, this));
    }
  };
  return Tributary;
})();
tributary.Reptile = (function() {
  __extends(Reptile, tributary.Tributary);
  function Reptile() {
    this.execute = __bind(this.execute, this);
    Reptile.__super__.constructor.apply(this, arguments);
  }
  Reptile.prototype.initialize = function() {
    Reptile.__super__.initialize.apply(this, arguments);
    this.set({
      code: "g.append(\"rect\").attr(\"width\", 100).attr(\"height\", 100)"
    });
    return this;
  };
  Reptile.prototype.execute = function() {
    var code;
    $('#clones').empty();
    delete tributary.initialize;
    try {
      console.log("ASDF", this.get("code"));
      code = "tributary.initialize = function(g) {";
      code += this.get("code");
      code += "};";
      eval(code);
      console.log("MAKE THE CLONES?");
      console.log("trib", tributary);
      tributary.make_clones();
      tributary.layout();
    } catch (_e) {}
    return true;
  };
  return Reptile;
})();
tributary.Delta = (function() {
  __extends(Delta, tributary.Tributary);
  function Delta() {
    this.execute = __bind(this.execute, this);
    Delta.__super__.constructor.apply(this, arguments);
  }
  Delta.prototype.execute = function() {
    var svg;
    $("#delta").empty();
    try {
      svg = d3.select(".tributary_svg");
      eval(this.get("code"));
    } catch (_e) {}
    if (tributary.bv) {
      $('#clones').empty();
      tributary.make_clones();
    }
    try {
      tributary.init(tributary.g);
    } catch (_e) {}
    try {
      tributary.execute();
    } catch (_e) {}
    return true;
  };
  return Delta;
})();
tributary.Flow = (function() {
  __extends(Flow, tributary.Tributary);
  function Flow() {
    this.execute = __bind(this.execute, this);
    Flow.__super__.constructor.apply(this, arguments);
  }
  Flow.prototype.execute = function() {
    var svg;
    $("#flow").empty();
    try {
      svg = d3.select("#flow");
      eval(this.get("code"));
    } catch (_e) {}
    try {
      tributary.append(tributary.g);
    } catch (_e) {}
    try {
      tributary.execute();
    } catch (_e) {}
    return true;
  };
  return Flow;
})();
tributary.Geyser = (function() {
  __extends(Geyser, tributary.Tributary);
  function Geyser() {
    this.execute = __bind(this.execute, this);
    Geyser.__super__.constructor.apply(this, arguments);
  }
  Geyser.prototype.execute = function() {
    var svg;
    $("#geyser").empty();
    try {
      svg = d3.select("#geyser");
      eval(this.get("code"));
    } catch (_e) {}
    try {
      tributary.append(tributary.g);
    } catch (_e) {}
    try {
      tributary.execute();
    } catch (_e) {}
    return true;
  };
  return Geyser;
})();
tributary.Fountain = (function() {
  __extends(Fountain, tributary.Tributary);
  function Fountain() {
    this.execute = __bind(this.execute, this);
    Fountain.__super__.constructor.apply(this, arguments);
  }
  Fountain.prototype.execute = function() {
    var svg;
    $("#fountain").empty();
    try {
      svg = d3.select("#fountain");
      eval(this.get("code"));
    } catch (_e) {}
    try {
      tributary.append(tributary.g);
    } catch (_e) {}
    try {
      tributary.execute();
    } catch (_e) {}
    return true;
  };
  return Fountain;
})();
tributary.TributaryView = (function() {
  __extends(TributaryView, Backbone.View);
  function TributaryView() {
    this._loadFile = __bind(this._loadFile, this);
    this._fileDrop = __bind(this._fileDrop, this);
    this._dragOver = __bind(this._dragOver, this);
    this.save_gist = __bind(this.save_gist, this);
    this.init_gui = __bind(this.init_gui, this);
    TributaryView.__super__.constructor.apply(this, arguments);
  }
  TributaryView.prototype.check_date = true;
  TributaryView.prototype.initialize = function() {
    this.endpoint = this.options.endpoint || "tributary";
    this.chosenRow = 0;
    this.chosenColumn = 0;
    this.onNumeric = false;
    d3.select("#editor").on("click", __bind(function() {
      this.sliding = false;
      return this.picking = false;
    }, this));
    d3.select(".CodeMirror").on("click", __bind(function() {
      this.sliding = false;
      return this.picking = false;
    }, this));
    this.code_editor = CodeMirror(d3.select("#editor").node(), {
      mode: "javascript",
      theme: "lesser-dark",
      lineNumbers: true,
      onChange: __bind(function() {
        var thisCode;
        thisCode = this.code_editor.getValue();
        return this.model.trigger("code", thisCode);
      }, this)
    });
    this.inlet = Inlet(this.code_editor);
    this.init_gui();
    if (this.model.get("code") != null) {
      this.code_editor.setValue(this.model.get("code"));
      this.model.execute();
    }
    this.model.get_code(__bind(function(error, code) {
      return this.code_editor.setValue(code);
    }, this));
    $('body')[0].addEventListener('dragover', this._dragOver, false);
    $('body')[0].addEventListener('drop', this._fileDrop, false);
    this.code_last_modified = new Date(0, 0, 0);
    this.past = new Date();
    d3.timer(__bind(function() {
      if (new Date() - this.past > 300) {
        if (this.file != null) {
          this._loadFile();
        }
        this.past = new Date();
      }
      return false;
    }, this));
    return this;
  };
  TributaryView.prototype.init_gui = function() {
    var editor, he;
    $('#tweet_this').append("tweet this");
    $('#tweetPanel').on("click", __bind(function(e) {
      return this.save_gist(function(newurl, newgist) {
        var tweetlink;
        tweetlink = "http://twitter.com/home/?status=See my latest %23tributary here " + "http://enjalot.com" + newurl;
        return window.location = tweetlink;
      });
    }, this));
    $('#savePanel').on('click', __bind(function(e) {
      return this.save_gist(function(newurl, newgist) {
        return window.location = newurl;
      });
    }, this));
    he = $('#hideEditor');
    he.on("click", function(e) {
      var txt;
      $("#editor").toggle();
      txt = he.html();
      if (txt === "Hide") {
        return he.html("Show");
      } else {
        return he.html("Hide");
      }
    });
    if (getLocalStorageValue('font-size')) {
      $('#editor').css('font-size', getLocalStorageValue('font-size'));
    }
    $('.font-control').on('click', function(e) {
      e.preventDefault();
      if ($(this).attr('class').indexOf('decrease') !== -1) {
        $('#editor').css('font-size', '-=1');
      } else {
        $('#editor').css('font-size', '+=1');
      }
      return setLocalStorageValue('font-size', $('#editor').css('font-size'));
    });
    this.editor_width = 800;
    this.editor_height = 300;
    editor = $('#editor');
    editor.css('width', this.editor_width);
    editor.css('height', this.editor_height);
    return this;
  };
  TributaryView.prototype.save_gist = function(callback) {
    var filename, gist, oldgist;
    oldgist = parseInt(this.model.get("gist"));
    filename = this.model.get("filename");
    if (filename === "") {
      filename = "inlet.js";
    }
    gist = {
      description: 'just another inlet to tributary',
      public: true,
      files: {}
    };
    gist.files[filename] = {
      content: this.model.get("code")
    };
    d3.select("#saveButton").style("background-image", "url(/static/img/ajax-loader.gif)");
    d3.select("#saveButton").style("background-repeat", "no-repeat");
    d3.select("#saveButton").style("top", "0px");
    return $.post('/tributary/save', {
      "gist": JSON.stringify(gist)
    }, __bind(function(data) {
      var newgist, newurl;
      if (typeof data === "string") {
        data = JSON.parse(data);
      }
      newgist = data.id;
      newurl = "/" + this.endpoint + "/" + newgist + "/" + filename;
      return callback(newurl, newgist);
    }, this));
  };
  TributaryView.prototype._dragOver = function(ev) {
    'Called when a user drags a file over the #drop_file div';    ev.stopPropagation();
    ev.preventDefault();
    return ev.dataTransfer.dropEffect = 'copy';
  };
  TributaryView.prototype._fileDrop = function(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    this.file = ev.dataTransfer.files[0];
    this.code_last_modified = new Date(0, 0, 0);
    return this._loadFile();
  };
  TributaryView.prototype._loadFile = function() {
    var reader;
    reader = new FileReader();
    if (!this.check_date || this.file.lastModifiedDate > this.code_last_modified) {
      console.log("read file!");
      reader.onload = __bind(function() {
        return this.code_editor.setValue(reader.result);
      }, this);
      this.code_last_modified = this.file.lastModifiedDate;
      return reader.readAsText(this.file);
    }
  };
  return TributaryView;
})();
tributary.GeyserView = (function() {
  __extends(GeyserView, Backbone.View);
  function GeyserView() {
    this.render = __bind(this.render, this);
    GeyserView.__super__.constructor.apply(this, arguments);
  }
  GeyserView.prototype.initialize = function() {
    return this;
  };
  GeyserView.prototype.render = function() {
    var geyserpad, keys, pad_data, padgh, padgw, padh, padn, pads, padsg, padw, spacing, xn, yn;
    padn = 16;
    xn = 4;
    yn = 4;
    spacing = 10;
    pad_data = d3.range(padn);
    geyserpad = d3.select("#geyserpad");
    padgw = parseInt(geyserpad.style("width"));
    padgh = parseInt(geyserpad.style("height"));
    padw = (padgw - spacing * xn) / xn;
    padh = (padgh - spacing * yn) / yn;
    keys = ['4', '5', '6', '7', 'r', 't', 'y', 'u', 'f', 'g', 'h', 'j', 'v', 'b', 'n', 'm'];
    padsg = geyserpad.append("g").attr("id", "geyserpads");
    pads = padsg.selectAll("rect.geyserpad").data(pad_data).enter().append("rect").attr("class", "geyserpad").attr("width", padw).attr("height", padh).attr("fill", "#000000").attr("stroke", "#000000").attr("stroke-width", 3).style("opacity", 0.3).attr("stroke-opacity", 1).attr("transform", __bind(function(d, i) {
      var x, y;
      x = i % xn * (padw + spacing) + spacing / 2;
      y = parseInt(i / yn) * (padh + spacing) + spacing / 2;
      return "translate(" + [x, y] + ")";
    }, this)).on("click", function() {}).on("mousedown", function(d, i) {
      d3.select(this).attr("fill", "#ffff00");
      return tributary.pads[i].start();
    }).on("mouseup", function(d, i) {
      d3.select(this).attr("fill", "#000");
      return tributary.pads[i].stop();
    }).each(function(d, i) {
      $('body').bind('keydown', jwerty.event(keys[d], __bind(function() {
        tributary.pads[d].start();
        return d3.select(this).attr("fill", "#ffff00");
      }, this)));
      return $('body').bind('keyup', jwerty.event(keys[d], __bind(function() {
        tributary.pads[d].stop();
        return d3.select(this).attr("fill", "#000");
      }, this)));
    });
    _.each(pad_data, function(d) {
      $('body').bind('keydown', jwerty.event(keys[d], function() {
        tributary.pads[d].start();
        return d3.select(this).attr("fill", "#ffff00");
      }));
      return $('body').bind('keyup', jwerty.event(keys[d], function() {
        return tributary.pads[d].stop();
      }));
    });
    return this;
  };
  return GeyserView;
})();
tributary.FountainView = (function() {
  __extends(FountainView, Backbone.View);
  function FountainView() {
    this.render = __bind(this.render, this);
    FountainView.__super__.constructor.apply(this, arguments);
  }
  FountainView.prototype.initialize = function() {
    return this;
  };
  FountainView.prototype.render = function() {
    var fountainpad, keys, pad_data, padgh, padgw, padh, padn, pads, padsg, padw, spacing, xn, yn;
    padn = 16;
    xn = 4;
    yn = 4;
    spacing = 10;
    pad_data = d3.range(padn);
    fountainpad = d3.select("#fountainpad");
    padgw = parseInt(fountainpad.style("width"));
    padgh = parseInt(fountainpad.style("height"));
    padw = (padgw - spacing * xn) / xn;
    padh = (padgh - spacing * yn) / yn;
    keys = ['4', '5', '6', '7', 'r', 't', 'y', 'u', 'f', 'g', 'h', 'j', 'v', 'b', 'n', 'm'];
    padsg = fountainpad.append("g").attr("id", "fountainpads");
    pads = padsg.selectAll("rect.fountainpad").data(pad_data).enter().append("rect").attr("class", "fountainpad").attr("width", padw).attr("height", padh).attr("fill", "#000000").attr("stroke", "#000000").attr("stroke-width", 3).style("opacity", 0.3).attr("stroke-opacity", 1).attr("transform", __bind(function(d, i) {
      var x, y;
      x = i % xn * (padw + spacing) + spacing / 2;
      y = parseInt(i / yn) * (padh + spacing) + spacing / 2;
      return "translate(" + [x, y] + ")";
    }, this)).on("click", function() {}).on("mousedown", function(d, i) {
      d3.select(this).attr("fill", "#ffff00");
      return tributary.pads[i].start();
    }).on("mouseup", function(d, i) {
      d3.select(this).attr("fill", "#000");
      return tributary.pads[i].stop();
    }).each(function(d, i) {
      $('body').bind('keydown', jwerty.event(keys[d], __bind(function() {
        tributary.pads[d].start();
        return d3.select(this).attr("fill", "#ffff00");
      }, this)));
      return $('body').bind('keyup', jwerty.event(keys[d], __bind(function() {
        tributary.pads[d].stop();
        return d3.select(this).attr("fill", "#000");
      }, this)));
    });
    _.each(pad_data, function(d) {
      $('body').bind('keydown', jwerty.event(keys[d], function() {
        tributary.pads[d].start();
        return d3.select(this).attr("fill", "#ffff00");
      }));
      return $('body').bind('keyup', jwerty.event(keys[d], function() {
        return tributary.pads[d].stop();
      }));
    });
    return this;
  };
  return FountainView;
})();