var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
  for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
  function ctor() { this.constructor = child; }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor;
  child.__super__ = parent.prototype;
  return child;
};
tributary.Tributary = (function() {
  __extends(Tributary, Backbone.Model);
  function Tributary() {
    this.init_slider = __bind(this.init_slider, this);
    this.editor_click = __bind(this.editor_click, this);
    this.newcode = __bind(this.newcode, this);
    Tributary.__super__.constructor.apply(this, arguments);
  }
  Tributary.prototype.init = function() {
    var JavaScriptMode, src_url;
    this.aceEditor = ace.edit("editor");
    this.aceEditor.setTheme("ace/theme/twilight");
    JavaScriptMode = require("ace/mode/javascript").Mode;
    this.aceEditor.getSession().setMode(new JavaScriptMode());
    this.aceEditor.getSession().on('change', __bind(function() {
      var thisCode;
      thisCode = this.aceEditor.getSession().getValue();
      return this.trigger("code", this.aceEditor.getSession().getValue());
    }, this));
    this.chosenRow = 0;
    this.chosenColumn = 0;
    this.onNumeric = false;
    this.aceEditor.on("click", this.editor_click);
    this.init_slider();
    if (this.get("gist") && this.get("filename")) {
      src_url = "/tributary/api/" + tributary.gist + "/" + tributary.filename;
      return d3.text(src_url, __bind(function(data) {
        return this.aceEditor.getSession().setValue(data);
      }, this));
    }
  };
  Tributary.prototype.newcode = function(code) {
    this.$el.find("svg").empty();
    this.set("code", code);
    try {
      eval(code);
    } catch (_e) {}
    return true;
  };
  Tributary.prototype.editor_click = function(e) {
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
      slider.slider('option', 'value', token.value);
      scrollerOffset = $('.ace_scroller').offset();
      cursorOffset = editor.renderer.$cursorLayer.pixelPos;
      sliderTop = scrollerOffset.top + cursorOffset.top - Number($('#editor').css('font-size').replace('px', '')) * 0.8;
      sliderLeft = scrollerOffset.left + cursorOffset.left - slider.width() / 2;
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
  Tributary.prototype.init_slider = function() {
    this.slider = $('#slider');
    return this.slider.slider({
      slide: __bind(function(event, ui) {
        var cursorPosition, token;
        cursorPosition = this.aceEditor.getCursorPosition();
        if (!(cursorPosition.row === this.chosenRow && cursorPosition.column === this.chosenColumn)) {
          this.aceEditor.getSelection().moveCursorTo(this.chosenRow, this.chosenColumn);
          this.aceEditor.clearSelection();
        }
        token = this.aceEditor.session.getTokenAt(chosenRow, chosenColumn + 1);
        this.aceEditor.find(String(token.value));
        return this.aceEditor.replace(String(ui.value));
      }, this)
    });
  };
  return Tributary;
})();