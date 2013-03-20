/* 
  ----------------------------------------------------
  Color Picker : 1.0 : 2012/04/06 : http://mudcu.be
  ----------------------------------------------------
  http://colrd.com/misc/labs/Color-Picker/Classic/index.html
  ----------------------------------------------------
  Firefox 2+, Safari 3+, Opera 9+, Google Chrome, IE9+
  ----------------------------------------------------
  picker = new Color.Picker({
    color: "#643263", // accepts rgba(), or #hex
    callback: function(rgba, state, type) {
      document.body.style.background = Color.Space(rgba, "RGBA>W3");
    }
  });
  picker.element.style.top = 220 + "px";
  picker.element.style.left = 270 + "px";
  picker.toggle(true);
  ----------------------------------------------------
  Color.Space.js – STRING, HEX, RGB, HSV, RGBA, HSVA, W3
*/if (typeof Color === "undefined") var Color = {};

(function() {
  Color.Picker = function(props) {
    var that = this;
    if (typeof props === "undefined") props = {};
    this.callback = props.callback;
    if (props.color[0] === "#") {
      this.color = Color.Space(props.color.substr(1), "STRING>HEX>RGB>HSV");
      this.color.A = 255;
    } else if (props.color.substr(0, 4) === "rgba") {
      this.color = Color.Space(props.color, "W3>RGBA>HSVA");
    }
    this.eyedropLayer = props.eyedropLayer;
    this.eyedropMouseLayer = props.eyedropMouseLayer || props.eyedropLayer;
    this.container = props.container || document.body;
    this.size = props.size || 200;
    this.margin = props.margin || 10;
    this.offset = this.margin / 2;
    this.hueWidth = props.hueWidth || 38;
    this.doAlpha = false;
    var plugin = document.createElement("div");
    plugin.className = "ColorPicker";
    var pickerWidth = this.size + this.hueWidth * (this.doAlpha ? 2 : 1) + this.margin - 6;
    var pickerHeight = this.size + this.margin * 2;
    plugin.style.height = pickerHeight + "px";
    plugin.style.width = pickerWidth + "px";
    plugin.style.display = props.display ? "block" : "none";
    this.container.appendChild(plugin);
    this.element = plugin;
    var hexBoxContainer = document.createElement("div");
    hexBoxContainer.style.backgroundImage = "url(" + interlace.data + ")";
    hexBoxContainer.className = "hexBox";
    hexBoxContainer.title = "Eyedropper";
    if (that.eyedropMouseLayer) {
      Event.add(hexBoxContainer, "mousedown", Event.cancel);
      Event.add(hexBoxContainer, "click", function() {
        document.body.style.cursor = "crosshair";
        var close = function(event) {
          document.body.style.cursor = "pointer";
          var coord = Event.coords(event);
          var ctx = that.eyedropLayer.getContext("2d");
          var data = ctx.getImageData(coord.x, coord.y, 1, 1);
          var color = Color.Space(data.data, "RGBA>HSVA");
          that.update(color, "HSVA");
          Event.remove(that.eyedropMouseLayer, "mousedown", close);
        };
        Event.add(that.eyedropMouseLayer, "mousedown", close);
      });
    }
    var hexBox = document.createElement("div");
    hexBoxContainer.appendChild(hexBox);
    plugin.appendChild(hexBoxContainer);
    var isHex = /[^a-f0-9]/gi;
    var hexInput = document.createElement("input");
    hexInput.title = "HEX Code";
    hexInput.className = "hexInput";
    hexInput.size = 6;
    hexInput.type = "text";
    Event.add(hexInput, "mousedown", Event.stopPropagation);
    Event.add(hexInput, "keydown change", function(event) {
      var code = event.keyCode;
      var value = hexInput.value.replace(isHex, "").substr(0, 6);
      var hex = parseInt("0x" + value);
      if (event.type == "keydown") {
        if (code == 40) {
          hex = Math.max(0, hex - (event.shiftKey ? 10 : 1));
          hexInput.value = Color.Space(hex, "HEX>STRING");
        } else if (code == 38) {
          hex = Math.min(16777215, hex + (event.shiftKey ? 10 : 1));
          hexInput.value = Color.Space(hex, "HEX>STRING");
        } else {
          return;
        }
      }
      if (String(hex) === "NaN") return;
      if (hex > 16777215) hex = 16777215;
      if (hex < 0) hex = 0;
      var update = event.type == "change" ? "" : "hex";
      that.update(Color.Space(hex, "HEX>RGB"), "RGB");
      if (event.keyCode == 27) this.blur();
    });
    plugin.appendChild(hexInput);
    var hexClose = document.createElement("div");
    hexClose.title = "Close";
    hexClose.className = "hexClose";
    hexClose.innerHTML = "x";
    Event.add(hexClose, "mousedown", Event.cancel);
    Event.add(hexClose, "click", function(event) {
      that.toggle(false);
    });
    plugin.appendChild(hexClose);
    plugin.appendChild(document.createElement("br"));
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    canvas.style.cssText = "position: absolute; top: 32px; left: " + this.offset + "px;";
    canvas.width = this.size + this.hueWidth * 2 + this.margin + 2;
    canvas.height = this.size + this.margin;
    plugin.appendChild(canvas);
    var mouse = function(event) {
      var down = event.type === "mousedown" || event.type === "touchstart";
      if (down) {
        Event.stop(event);
        hexInput.blur();
      }
      var offset = that.margin / 2;
      var abs = {
        x: 0,
        y: 0
      };
      if (window !== canvas) {
        var tmp = canvas;
        while (tmp !== null) {
          abs.x += tmp.offsetLeft;
          abs.y += tmp.offsetTop;
          tmp = tmp.offsetParent;
        }
      }
      var x0 = event.pageX - abs.x - offset;
      var y0 = event.pageY - abs.y - offset;
      var x = clamp(x0, 0, canvas.width);
      var y = clamp(y0, 0, that.size);
      if (event.target.className === "hexInput") {
        plugin.style.cursor = "text";
        return;
      } else if (x !== x0 || y !== y0) {
        plugin.style.cursor = "move";
        plugin.title = "Move";
        if (down) dragElement({
          type: "move",
          event: event,
          element: plugin,
          callback: function(event, self) {
            plugin.style.left = self.x + "px";
            plugin.style.top = self.y + "px";
            Event.prevent(event);
          }
        });
      } else if (x <= that.size) {
        plugin.style.cursor = "crosshair";
        plugin.title = "Saturation + Value";
        if (down) dragElement({
          type: "difference",
          event: event,
          element: canvas,
          callback: function(event, self) {
            var x = clamp(self.x - that.offset, 0, that.size);
            var y = clamp(self.y - that.offset, 0, that.size);
            that.color.S = x / that.size * 100;
            that.color.V = 100 - y / that.size * 100;
            that.drawSample(self.state, true);
            Event.prevent(event);
          }
        });
      } else if (x > that.size + that.margin && x <= that.size + that.hueWidth) {
        plugin.style.cursor = "crosshair";
        plugin.title = "Hue";
        if (down) dragElement({
          type: "difference",
          event: event,
          element: canvas,
          callback: function(event, self) {
            var y = clamp(self.y - that.offset, 0, that.size);
            that.color.H = 360 - Math.min(1, y / that.size) * 360;
            that.drawSample(self.state, true);
            Event.prevent(event);
          }
        });
      } else if (x > that.size + that.hueWidth + that.margin && x <= that.size + that.hueWidth * 2) {
        plugin.style.cursor = "crosshair";
        plugin.title = "Alpha";
        if (down) dragElement({
          type: "difference",
          event: event,
          element: canvas,
          callback: function(event, self) {
            var y = clamp(self.y - that.offset, 0, that.size);
            that.color.A = (1 - Math.min(1, y / that.size)) * 255;
            that.drawSample(self.state, true);
            Event.prevent(event);
          }
        });
      } else {
        plugin.style.cursor = "default";
      }
      return false;
    };
    Event.add(plugin, "mousemove", mouse);
    Event.add(plugin, "mousedown", mouse);
    this.update = function(color) {
      if (typeof color === "string") {
        that.color = Color.Space(color, "STRING>HEX>RGB>HSV");
      } else if (typeof color.R !== "undefined") {
        that.color = Color.Space(color, "RGB>HSV");
      } else if (typeof color.H !== "undefined") {
        that.color = color;
      }
      if (typeof color.A === "undefined") {
        that.color.A = 255;
      }
      that.drawSample("update", true);
    };
    this.drawSample = function(state, update) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      that.drawSquare();
      that.drawHue();
      if (this.doAlpha) that.drawAlpha();
      var rgba = Color.Space(that.color, "HSVA>RGBA");
      var hex = Color.Space(rgba, "RGB>HEX>STRING");
      hexInput.value = hex.toUpperCase();
      hexBox.style.backgroundColor = Color.Space(rgba, "RGBA>W3");
      var y = (360 - that.color.H) / 362 * that.size - 2;
      ctx.drawImage(arrow, that.size + that.hueWidth + that.offset + 2, Math.round(y) + that.offset - 1);
      if (this.doAlpha) {
        var y = (255 - that.color.A) / 255 * that.size - 2;
        ctx.drawImage(arrow, that.size + that.hueWidth * 2 + that.offset + 2, Math.round(y) + that.offset - 1);
      }
      var x = that.color.S / 100 * that.size;
      var y = (1 - that.color.V / 100) * that.size;
      x = x - circle.width / 2;
      y = y - circle.height / 2;
      ctx.drawImage(circle, Math.round(x) + that.offset, Math.round(y) + that.offset);
      if (that.callback && state && update) {
        that.callback(rgba, state);
      }
    };
    this.drawSquare = function() {
      var hex = Color.Space({
        H: that.color.H,
        S: 100,
        V: 100
      }, "HSV>RGB>HEX>STRING");
      var rgb = Color.Space.HEX_RGB("0x" + hex);
      var offset = that.offset;
      var size = that.size;
      ctx.fillStyle = "#" + hex;
      ctx.fillRect(offset, offset, size, size);
      var gradient = ctx.createLinearGradient(offset, offset, size + offset, 0);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(offset, offset, size, size);
      var gradient = ctx.createLinearGradient(0, offset, 0, size + offset);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 1)");
      ctx.fillStyle = gradient;
      ctx.fillRect(offset, offset, size, size);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.strokeRect(offset + .5, offset + .5, size - 1, size - 1);
    };
    this.drawHue = function() {
      var left = that.size + that.margin + that.offset;
      var gradient = ctx.createLinearGradient(0, 0, 0, that.size + that.offset);
      gradient.addColorStop(0, "rgba(255, 0, 0, 1)");
      gradient.addColorStop(5 / 6, "rgba(255, 255, 0, 1)");
      gradient.addColorStop(4 / 6, "rgba(0, 255, 0, 1)");
      gradient.addColorStop(3 / 6, "rgba(0, 255, 255, 1)");
      gradient.addColorStop(2 / 6, "rgba(0, 0, 255, 1)");
      gradient.addColorStop(1 / 6, "rgba(255, 0, 255, 1)");
      gradient.addColorStop(1, "rgba(255, 0, 0, 1)");
      ctx.fillStyle = gradient;
      ctx.fillRect(left, that.offset, that.hueWidth - 10, that.size);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.strokeRect(left + .5, that.offset + .5, that.hueWidth - 11, that.size - 1);
    };
    this.drawAlpha = function() {
      var left = that.size + that.margin + that.offset + that.hueWidth;
      ctx.fillStyle = interlace;
      ctx.fillRect(left, that.offset, that.hueWidth - 10, that.size);
      var rgb = Color.Space.HSV_RGB({
        H: that.color.H,
        S: that.color.S,
        V: that.color.V
      });
      var gradient = ctx.createLinearGradient(0, 0, 0, that.size);
      rgb.A = 255;
      gradient.addColorStop(0, Color.Space.RGBA_W3(rgb));
      rgb.A = 0;
      gradient.addColorStop(1, Color.Space.RGBA_W3(rgb));
      ctx.fillStyle = gradient;
      ctx.fillRect(left, that.offset, that.hueWidth - 10, that.size);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.strokeRect(left + .5, that.offset + .5, that.hueWidth - 11, that.size - 1);
    };
    this.toggle = function(display) {
      if (typeof display !== "boolean") {
        if (plugin.style.display === "block") {
          display = false;
        } else {
          display = true;
        }
      }
      if (display) {
        plugin.style.opacity = 1;
        plugin.style.display = "block";
      } else {
        plugin.style.opacity = 0;
        plugin.style.display = "none";
      }
      if (display && props.autoclose) {
        var mousedown = function() {
          Event.remove(window, "mousedown", mousedown);
          that.toggle(false);
        };
        Event.add(window, "mousedown", mousedown);
      }
    };
    this.destory = function() {
      document.body.removeChild(plugin);
      for (var key in that) delete that[key];
    };
    this.drawSample("create");
    return this;
  };
  var arrow = function() {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var size = 16;
    var width = size / 3;
    canvas.width = size;
    canvas.height = size;
    var top = -size / 4;
    var left = 0;
    for (var n = 0; n < 20; n++) {
      ctx.beginPath();
      ctx.fillStyle = "#fff";
      ctx.moveTo(left, size / 2 + top);
      ctx.lineTo(left + size / 4, size / 4 + top);
      ctx.lineTo(left + size / 4, size / 4 * 3 + top);
      ctx.fill();
    }
    ctx.translate(-width, -size);
    return canvas;
  }();
  var circle = function() {
    var canvas = document.createElement("canvas");
    canvas.width = 10;
    canvas.height = 10;
    var ctx = canvas.getContext("2d");
    ctx.lineWidth = 1;
    ctx.beginPath();
    var x = canvas.width / 2;
    var y = canvas.width / 2;
    ctx.arc(x, y, 4.5, 0, Math.PI * 2, true);
    ctx.strokeStyle = "#000";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2, true);
    ctx.strokeStyle = "#FFF";
    ctx.stroke();
    return canvas;
  }();
  var interlace = function(size, color1, color2) {
    var proto = document.createElement("canvas").getContext("2d");
    proto.canvas.width = size * 2;
    proto.canvas.height = size * 2;
    proto.fillStyle = color1;
    proto.fillRect(0, 0, size, size);
    proto.fillStyle = color2;
    proto.fillRect(size, 0, size, size);
    proto.fillStyle = color2;
    proto.fillRect(0, size, size, size);
    proto.fillStyle = color1;
    proto.fillRect(size, size, size, size);
    var pattern = proto.createPattern(proto.canvas, "repeat");
    pattern.data = proto.canvas.toDataURL();
    return pattern;
  }(8, "#FFF", "#eee");
  var clamp = function(n, min, max) {
    return n < min ? min : n > max ? max : n;
  };
  var dragElement = function(props) {
    function mouseMove(e, state) {
      if (typeof state == "undefined") state = "move";
      var coord = XY(e);
      switch (props.type) {
       case "move":
        props.callback(event, {
          x: coord.x + oX - eX,
          y: coord.y + oY - eY,
          state: state
        });
        break;
       case "difference":
        props.callback(event, {
          x: coord.x - oX,
          y: coord.y - oY,
          state: state
        });
        break;
       default:
        props.callback(event, {
          x: coord.x,
          y: coord.y,
          state: state
        });
        break;
      }
    }
    function mouseUp(e) {
      window.removeEventListener("mousemove", mouseMove, false);
      window.removeEventListener("mouseup", mouseUp, false);
      mouseMove(e, "up");
    }
    var el = props.element;
    var origin = {
      x: 0,
      y: 0
    };
    if (window !== el) {
      var tmp = el;
      while (tmp !== null) {
        origin.x += tmp.offsetLeft;
        origin.y += tmp.offsetTop;
        tmp = tmp.offsetParent;
      }
    }
    var oX = origin.x;
    var oY = origin.y;
    var e = props.event;
    var coord = XY(e);
    var eX = coord.x;
    var eY = coord.y;
    window.addEventListener("mousemove", mouseMove, false);
    window.addEventListener("mouseup", mouseUp, false);
    mouseMove(e, "down");
  };
  var Event = {
    add: function(target, type, listener) {
      if (type.indexOf(" ") !== -1) {
        type = type.split(" ");
        for (var n = 0; n < type.length; n++) {
          Event.add(target, type[n], listener);
        }
      } else {
        if (target.addEventListener) {
          target.addEventListener(type, listener, false);
        } else if (target.attachEvent) {
          target.attachEvent(type, listener);
        }
      }
    },
    remove: function(target, type, listener) {
      if (target.removeEventListener) {
        target.removeEventListener(type, listener, false);
      } else if (target.detachEvent) {
        target.detachEvent(type, listener);
      }
    },
    stop: function(event) {
      if (event.stopPropagation) {
        event.stopPropagation();
      } else {
        event.cancelBubble = true;
      }
    },
    prevent: function(event) {
      if (event.preventDefault) {
        event.preventDefault();
      } else {
        event.returnValue = false;
      }
    }
  };
  var XY = window.ActiveXObject ? function(event) {
    return {
      x: event.clientX + document.documentElement.scrollLeft,
      y: event.clientY + document.documentElement.scrollTop
    };
  } : function(event) {
    return {
      x: event.pageX,
      y: event.pageY
    };
  };
})();

if (typeof Color === "undefined") Color = {};

if (typeof Color.Space === "undefined") Color.Space = {};

(function() {
  var DEG_RAD = Math.PI / 180;
  var RAD_DEG = 1 / DEG_RAD;
  var functions = {};
  var shortcuts = {
    "RGB>STRING": "RGB>HEX>STRING",
    "STRING>RGB": "STRING>HEX>RGB"
  };
  var root = Color.Space = function(color, route) {
    if (shortcuts[route]) {
      route = shortcuts[route];
    }
    var r = route.split(">");
    if (typeof color === "object" && color[0] >= 0) {
      var type = route.split(">")[0];
      var tmp = {};
      for (var i = 0; i < type.length; i++) {
        var str = type.substr(i, 1);
        tmp[str] = color[i];
      }
      color = tmp;
    }
    if (functions[route]) {
      return functions[route](color);
    }
    var f = "color";
    for (var pos = 1, key = r[0]; pos < r.length; pos++) {
      if (pos > 1) {
        key = key.substr(key.indexOf("_") + 1);
      }
      key += (pos === 0 ? "" : "_") + r[pos];
      color = root[key](color);
      f = "Color.Space." + key + "(" + f + ")";
    }
    functions[route] = eval("(function(color) { return " + f + " })");
    return color;
  };
  root.RGB_W3 = function(o) {
    return "rgb(" + (o.R >> 0) + "," + (o.G >> 0) + "," + (o.B >> 0) + ")";
  };
  root.RGBA_W3 = function(o) {
    var alpha = typeof o.A === "number" ? o.A / 255 : 1;
    return "rgba(" + (o.R >> 0) + "," + (o.G >> 0) + "," + (o.B >> 0) + "," + alpha + ")";
  };
  root.W3_RGB = function(o) {
    var o = o.substr(4, o.length - 5).split(",");
    return {
      R: parseInt(o[0]),
      G: parseInt(o[1]),
      B: parseInt(o[2])
    };
  };
  root.W3_RGBA = function(o) {
    var o = o.substr(5, o.length - 6).split(",");
    return {
      R: parseInt(o[0]),
      G: parseInt(o[1]),
      B: parseInt(o[2]),
      A: parseFloat(o[3]) * 255
    };
  };
  root.STRING_HEX = function(o) {
    return parseInt("0x" + o);
  };
  root.STRING_HEX32 = function(o) {
    if (o.length === 6) {
      return parseInt("0xFF" + o);
    } else {
      return parseInt("0x" + o);
    }
  };
  root.HEX_STRING = function(o, maxLength) {
    if (!maxLength) maxLength = 6;
    if (!o) o = 0;
    var z = o.toString(16);
    var n = z.length;
    while (n < maxLength) {
      z = "0" + z;
      n++;
    }
    var n = z.length;
    while (n > maxLength) {
      z = z.substr(1);
      n--;
    }
    return z;
  };
  root.HEX32_STRING = function(o) {
    return root.HEX_STRING(o, 8);
  };
  root.HEX_RGB = function(o) {
    return {
      R: o >> 16,
      G: o >> 8 & 255,
      B: o & 255
    };
  };
  root.HEX32_RGBA = function(o) {
    return {
      R: o >>> 16 & 255,
      G: o >>> 8 & 255,
      B: o & 255,
      A: o >>> 24
    };
  };
  root.RGBA_HEX32 = function(o) {
    return (o.A << 24 | o.R << 16 | o.G << 8 | o.B) >>> 0;
  };
  root.RGB_HEX = function(o) {
    if (o.R < 0) o.R = 0;
    if (o.G < 0) o.G = 0;
    if (o.B < 0) o.B = 0;
    if (o.R > 255) o.R = 255;
    if (o.G > 255) o.G = 255;
    if (o.B > 255) o.B = 255;
    return o.R << 16 | o.G << 8 | o.B;
  };
  root.RGBA_HSVA = root.RGB_HSV = function(o) {
    var _R = o.R / 255, _G = o.G / 255, _B = o.B / 255, min = Math.min(_R, _G, _B), max = Math.max(_R, _G, _B), D = max - min, H, S, V = max;
    if (D === 0) {
      H = 0;
      S = 0;
    } else {
      S = D / max;
      var DR = ((max - _R) / 6 + D / 2) / D;
      var DG = ((max - _G) / 6 + D / 2) / D;
      var DB = ((max - _B) / 6 + D / 2) / D;
      if (_R === max) H = DB - DG; else if (_G === max) H = 1 / 3 + DR - DB; else if (_B === max) H = 2 / 3 + DG - DR;
      if (H < 0) H += 1;
      if (H > 1) H -= 1;
    }
    return {
      H: H * 360,
      S: S * 100,
      V: V * 100,
      A: o.A
    };
  };
  root.HSVA_RGBA = root.HSV_RGB = function(o) {
    var H = o.H / 360;
    var S = o.S / 100;
    var V = o.V / 100;
    var R, G, B;
    if (S === 0) {
      R = G = B = Math.round(V * 255);
    } else {
      if (H >= 1) H = 0;
      H = 6 * H;
      D = H - Math.floor(H);
      A = Math.round(255 * V * (1 - S));
      B = Math.round(255 * V * (1 - S * D));
      C = Math.round(255 * V * (1 - S * (1 - D)));
      V = Math.round(255 * V);
      switch (Math.floor(H)) {
       case 0:
        R = V;
        G = C;
        B = A;
        break;
       case 1:
        R = B;
        G = V;
        B = A;
        break;
       case 2:
        R = A;
        G = V;
        B = C;
        break;
       case 3:
        R = A;
        G = B;
        B = V;
        break;
       case 4:
        R = C;
        G = A;
        B = V;
        break;
       case 5:
        R = V;
        G = A;
        B = B;
        break;
      }
    }
    return {
      R: R,
      G: G,
      B: B,
      A: o.A
    };
  };
})();

var Inlet = function() {
  function inlet(ed, options) {
    var editor = ed;
    var slider;
    var picker;
    if (!options) options = {};
    var container = options.container || document.body;
    var wrapper = editor.getWrapperElement();
    wrapper.addEventListener("mousedown", onClick);
    editor.setOption("onKeyEvent", onKeyDown);
    var sliderDiv = document.createElement("div");
    sliderDiv.className = "inlet_slider";
    sliderDiv.style.visibility = "hidden";
    sliderDiv.style.position = "absolute";
    sliderDiv.style.top = 0;
    container.appendChild(sliderDiv);
    var slider = document.createElement("input");
    slider.className = "range";
    slider.setAttribute("type", "range");
    slider.addEventListener("change", onSlide);
    sliderDiv.appendChild(slider);
    var slideCursor;
    function onSlide(event) {
      var value = String(slider.value);
      var cursor = slideCursor;
      var number = getNumber(cursor);
      var start = {
        line: cursor.line,
        ch: number.start
      };
      var end = {
        line: cursor.line,
        ch: number.end
      };
      editor.replaceRange(value, start, end);
    }
    function onKeyDown() {
      if (arguments.length == 1) {
        event = arguments[0];
      } else {
        event = arguments[1];
      }
      if (event.keyCode == 37) {
        if (sliderDiv.style.visibility === "visible") {
          slider.stepDown(1);
          onSlide();
          return true;
        } else {
          picker.element.style.display = "none";
        }
      } else if (event.keyCode == 39) {
        if (sliderDiv.style.visibility === "visible") {
          slider.stepUp(1);
          onSlide();
          return true;
        } else {
          picker.element.style.display = "none";
        }
      } else {
        sliderDiv.style.visibility = "hidden";
        picker.element.style.display = "none";
      }
    }
    picker = new Color.Picker({
      container: container,
      color: "#643263",
      display: false,
      size: 150,
      callback: function(rgba, state, type) {
        var newcolor = Color.Space(rgba, "RGB>STRING");
        var cursor = editor.getCursor();
        var token = editor.getTokenAt(cursor);
        var start = {
          line: cursor.line,
          ch: token.start
        };
        var end = {
          line: cursor.line,
          ch: token.end
        };
        start.ch = start.ch + token.string.indexOf("#");
        var match = token.string.match(/#+(([a-fA-F0-9]){3}){1,2}/)[0];
        end.ch = start.ch + match.length;
        editor.replaceRange("#" + newcolor.toUpperCase(), start, end);
      }
    });
    function onClick(ev) {
      var cursor = editor.getCursor(true);
      slideCursor = cursor;
      var token = editor.getTokenAt(cursor);
      cursorOffset = editor.cursorCoords(true, "page");
      var number = getNumber(cursor);
      var hexMatch = token.string.match(/#+(([a-fA-F0-9]){3}){1,2}/);
      if (hexMatch) {
        var color = hexMatch[0];
        color = color.slice(1, color.length);
        picker.update(color);
        var top = cursorOffset.top - 210 + "px";
        var left = cursorOffset.left - 75 + "px";
        var ColorPicker = picker.element;
        console.log("PICKER", picker);
        ColorPicker.style.position = "absolute";
        ColorPicker.style.top = top;
        ColorPicker.style.left = left;
        picker.toggle(true);
        sliderDiv.style.visibility = "hidden";
      } else if (number) {
        picker.toggle(false);
        slider.value = 0;
        var value = parseFloat(number.string);
        var sliderRange;
        if (value === 0) {
          sliderRange = [ -100, 100 ];
        } else {
          sliderRange = [ -value * 3, value * 5 ];
        }
        if (sliderRange[0] < sliderRange[1]) {
          sliderMin = sliderRange[0];
          sliderMax = sliderRange[1];
        } else {
          sliderMin = sliderRange[1];
          sliderMax = sliderRange[0];
        }
        slider.setAttribute("min", sliderMin);
        slider.setAttribute("max", sliderMax);
        if (sliderMax - sliderMin > 20) {
          slider.setAttribute("step", 1);
        } else {
          slider.setAttribute("step", (sliderMax - sliderMin) / 200);
        }
        slider.setAttribute("value", value);
        slider.value = value;
        var y_offset = 15;
        var sliderTop = cursorOffset.top - y_offset;
        var sliderStyle = window.getComputedStyle(sliderDiv);
        var sliderWidth = getPixels(sliderStyle.width);
        var sliderLeft = cursorOffset.left - sliderWidth / 2;
        sliderDiv.style.top = sliderTop - 10 + "px";
        sliderDiv.style.left = sliderLeft + "px";
        sliderDiv.style.visibility = "visible";
        picker.element.style.display = "none";
      } else {
        slideCursor = null;
        sliderDiv.style.visibility = "hidden";
        picker.element.style.display = "none";
      }
    }
    function getNumber(cursor) {
      var line = editor.getLine(cursor.line);
      var re = /[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
      var match = re.exec(line);
      while (match) {
        var val = match[0];
        var len = val.length;
        var start = match.index;
        var end = match.index + len;
        if (cursor.ch >= start && (cursor.ch <= end || cursor.ch - 1 == end))  {
          match = null;
          return {
            start: start,
            end: end,
            string: val
          };
        }
        match = re.exec(line);
      }
      return;
    }
  }
  function getPixels(style) {
    var pix = 0;
    if (style.length > 2) {
      pix = parseFloat(style.slice(0, style.length - 2));
    }
    if (!pix) pix = 0;
    return pix;
  }
  function getOffset(el) {
    var _x = 0;
    var _y = 0;
    while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
      _x += el.offsetLeft - el.scrollLeft;
      _y += el.offsetTop - el.scrollTop;
      el = el.offsetParent;
    }
    return {
      top: _y,
      left: _x
    };
  }
  return inlet;
}();