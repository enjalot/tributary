/*
 * The Main function is the backbone of the contexts. 
 * it listens on execute events and does things like clean, execute and render
 * as well as emitting events along the way
 */
tributary.Main = function(options) {
  var el = options.el;
  tributary.__events__.on("execute", execute, this);

  if(!tributary.__config__) {
    tributary.__config__ = new tributary.Config();
  }
  this.config = tributary.__config__;
  this.config.on("change:display", set_display, this);

  tributary.init = undefined;
  tributary.run = undefined;

  //autoinit determins whether we call tributary.init by default
  tributary.autoinit = this.config.get("autoinit");
  tributary.render = function() {};
  tributary.execute = function() {};
  tributary.clear = function() {};

  function execute() {
    if(tributary.__noupdate__) return;
    try {
      //empty out our display element
      if(tributary.autoinit) {
        tributary.clear();
        //trigger all the contexts to execute, after the canvas has been cleared
        tributary.__events__.trigger("post:execute");
      }
      //then we run the user defined run function
      tributary.execute();
      tributary.render();
    } catch (err) {
      return false;
    }
    return true;
  }

  tributary.__displayFns__ = {
    "svg": makeSvg,
    "div": makeDiv,
    "canvas": makeCanvas,
    "webgl": makeWebgl
  }

  function set_display() {

    tributary.clear();
    var display = this.config.get("display");
    var fn = tributary.__displayFns__[display]
    if(fn) { fn(el); }
    else {
      tributary.clear = function() {
        d3.select(el).selectAll("*").remove();
      };
    }
  }

  function makeDiv(el) {
    tributary.__svg__ = null;
    tributary.g = d3.select(el);
  }

  function makeSvg(el) {
    //Use mustache or other templates here? naaah...
    var svg = d3.select(el).append("svg")
      .attr({
        "xmlns":"http://www.w3.org/2000/svg",
        //this usually requires xmlns:xlink but chrome wont let me add that
        "xlink":"http://www.w3.org/1999/xlink",
        class:"tributary_svg",
        width: "100%",
        height: "100%"
      });
    tributary.g = svg;
    tributary.__svg__ = svg;
    tributary.clear = function() {
      tributary.__svg__.selectAll("*").remove();
    };
  }

  function makeCanvas(el) {
    tributary.__svg__ = null;
    tributary.clear = function() {
      tributary.canvas.width = tributary.sw;
      tributary.canvas.height = tributary.sh;
      tributary.ctx.clearRect(0, 0, tributary.sw, tributary.sh);
    };
    tributary.canvas = d3.select(el).append("canvas")
      .classed("tributary_canvas",true)
      .node();
    tributary.ctx = tributary.canvas.getContext('2d');
    tributary.g = tributary.ctx;
  }

  set_display.call(this);
}
