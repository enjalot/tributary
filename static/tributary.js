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
    $("svg").empty();
    try {
      eval(this.get("code"));
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
        if (!data) {
          data = "";
        }
        this.set({
          code: data
        });
        return callback(null, data);
      }, this));
    }
  };
  return Tributary;
})();
tributary.Delta = (function() {
  __extends(Delta, tributary.Tributary);
  function Delta() {
    this.execute = __bind(this.execute, this);
    Delta.__super__.constructor.apply(this, arguments);
  }
  Delta.prototype.execute = function() {
    $("#delta").empty();
    try {
      eval(this.get("code"));
    } catch (_e) {}
    if (tributary.bv) {
      $('#clones').empty();
      make_clones();
    }
    try {
      tributary.append(tributary.g);
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
    $("#flow").empty();
    try {
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
    $("#geyser").empty();
    try {
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
tributary.TributaryView = (function() {
  __extends(TributaryView, Backbone.View);
  function TributaryView() {
    this.save_gist = __bind(this.save_gist, this);
    this.init_gui = __bind(this.init_gui, this);
    this.init_slider = __bind(this.init_slider, this);
    this.editor_click = __bind(this.editor_click, this);
    TributaryView.__super__.constructor.apply(this, arguments);
  }
  TributaryView.prototype.initialize = function() {
    var JavaScriptMode;
    this.endpoint = this.options.endpoint || "tributary";
    this.aceEditor = this.model.aceEditor;
    this.chosenRow = 0;
    this.chosenColumn = 0;
    this.onNumeric = false;
    this.aceEditor = ace.edit("editor");
    this.aceEditor.setTheme("ace/theme/twilight");
    JavaScriptMode = require("ace/mode/javascript").Mode;
    this.aceEditor.getSession().setMode(new JavaScriptMode());
    this.aceEditor.getSession().on('change', __bind(function() {
      var thisCode;
      thisCode = this.aceEditor.getSession().getValue();
      return this.model.trigger("code", this.aceEditor.getSession().getValue());
    }, this));
    this.init_slider();
    this.init_gui();
    this.model.get_code(__bind(function(error, code) {
      return this.aceEditor.getSession().setValue(code);
    }, this));
    "if(@model.get(\"gist\") && @model.get(\"filename\"))\n    src_url = \"/tributary/api/\" + @model.get(\"gist\")  + \"/\" + @model.get(\"filename\")\n    d3.text(src_url, (data) =>\n        if(!data)\n            data = \"\"\n        @aceEditor.getSession().setValue(data)\n        #@model.trigger(\"code\", data)\n    )";
    this.aceEditor.on("click", this.editor_click);
    return this;
  };
  TributaryView.prototype.editor_click = function(e) {
    var cursorOffset, editor, pos, pulseNumerics, scrollerOffset, sliderLeft, sliderRange, sliderTop, token;
    editor = e.editor;
    pos = editor.getCursorPosition();
    token = editor.session.getTokenAt(pos.row, pos.column);
    this.onNumeric = false;
    if (token && /\bconstant.numeric\b/.test(token.type)) {
      if (pulseNumerics) {
        window.clearInterval(pulse);
        pulseNumerics = false;
      }
      if (token.value === 0) {
        sliderRange = [-100, 100];
      } else {
        sliderRange = [-token.value * 3, token.value * 5];
      }
      this.slider.slider('option', 'max', d3.max(sliderRange));
      this.slider.slider('option', 'min', d3.min(sliderRange));
      if ((d3.max(sliderRange) - d3.min(sliderRange)) > 20) {
        this.slider.slider('option', 'step', 1);
      } else {
        this.slider.slider('option', 'step', (d3.max(sliderRange) - d3.min(sliderRange)) / 200);
      }
      this.slider.slider('option', 'value', token.value);
      scrollerOffset = $('.ace_scroller').offset();
      cursorOffset = editor.renderer.$cursorLayer.pixelPos;
      sliderTop = scrollerOffset.top + cursorOffset.top - Number($('#editor').css('font-size').replace('px', '')) * 0.8;
      sliderLeft = scrollerOffset.left + cursorOffset.left - this.slider.width() / 2;
      this.slider.css('font-size', $('#editor').css('font-size'));
      this.slider.css('font-size', '-=4');
      this.slider.offset({
        top: sliderTop - 10,
        left: sliderLeft
      });
      this.slider.css('visibility', 'visible');
      this.onNumeric = true;
      this.chosenRow = pos.row;
      this.chosenColumn = token.start;
      return e.stopPropagation();
    } else {
      return this.slider.css('visibility', 'hidden');
    }
  };
  TributaryView.prototype.init_slider = function() {
    this.slider = $('#slider');
    return this.slider.slider({
      slide: __bind(function(event, ui) {
        var cursorPosition, token;
        cursorPosition = this.aceEditor.getCursorPosition();
        if (!(cursorPosition.row === this.chosenRow && cursorPosition.column === this.chosenColumn)) {
          this.aceEditor.getSelection().moveCursorTo(this.chosenRow, this.chosenColumn);
          this.aceEditor.clearSelection();
        }
        token = this.aceEditor.session.getTokenAt(this.chosenRow, this.chosenColumn + 1);
        this.aceEditor.find(String(token.value));
        return this.aceEditor.replace(String(ui.value));
      }, this)
    });
  };
  TributaryView.prototype.init_gui = function() {
    var he, pulse, pulseNumerics;
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
      $('#gui').toggle();
      txt = he.html();
      if (txt === "Hide") {
        he.html("Show");
        return $('#slider').css('visibility', 'hidden');
      } else {
        return he.html("Hide");
      }
    });
    this.aceEditor.renderer.setHScrollBarAlwaysVisible(false);
    this.aceEditor.setShowPrintMargin(false);
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
    this.aceEditor.replace = function(replacement) {
      var range;
      range = this.getSelectionRange();
      if (range !== null) {
        this.$tryReplace(range, replacement);
        if (range !== null) {
          return this.selection.setSelectionRange(range);
        }
      }
    };
    $('body').on('focus click', __bind(function(e) {
      return this.onNumeric = false;
    }, this));
    pulseNumerics = true;
    pulse = setInterval(function() {
      return $('.ace_numeric').animate({
        opacity: 0.5
      }).animate({
        opacity: 1
      });
    }, 1000);
    return this;
  };
  TributaryView.prototype.save_gist = function(callback) {
    var filename, gist, oldgist;
    console.log("ENDPOINT", this.endpoint);
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
    var geyserpad, pad_data, padgh, padgw, padh, padn, pads, padsg, padw, spacing, xn, yn;
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
    });
    return this;
  };
  return GeyserView;
})();