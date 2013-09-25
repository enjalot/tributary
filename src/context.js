
//The Context is the essential part of tributary, it is what makes assumptions
//about the code and provides the context for the code to execute.

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

Tributary.init = init; //expose for plugins
function init(options) {
  this.model = options.model;
  this.el = options.el;
  this.config = options.config;
  //execute on code changes (if not silenced)
  //this.model.on("change:code", this.execute, this);
  if(!options.silent) {
    this.model.on("change:code", function() {
      tributary.__events__.trigger("execute");
    });
    tributary.__events__.on("post:execute", this.execute, this)
  }
  //if the user has modified the code, we want to protect them from losing their work
  this.model.on("change:code", function() {
    //TODO: use CodeMirror .isClean / .markClean when switch to v3
    tributary.__events__.trigger("warnchanged");
  }, this);
}


//The JS context evaluates js in the global namespace
tributary.JSContext = function(options) {
  this.execute = function() {
    if(tributary.__noupdate__) return;
    var js = this.model.get("code");
    js = this.model.handleParser(js)
    try {
      //eval(js);
      var initialize = new Function("g", "tributary", js);
      initialize(tributary.g, tributary)
    } catch (e) {
      this.model.trigger("error", e);
      return false;
    }
    this.model.trigger("noerror");
    return true;
  }
  init.call(this, options);
}

//Coffeescript Context
tributary.CoffeeContext = function(options) {
  this.execute = function() {
    if(tributary.__noupdate__) return;
    try {
      //TODO: use coffee compilation to give errors/warnings
      var code = this.model.get("code");
      js = CoffeeScript.compile(code, {"bare":true});
      //js = this.model.handleParser(js)
    } catch(err) {
      this.model.trigger("error", err);
      return false;
    }
    try {
      //eval(js);
      var initialize = new Function("g", "tributary", js);
      initialize(tributary.g, tributary)
    } catch (err) {
      this.model.trigger("error", err);
      return false;
    }
    this.model.trigger("noerror");
    return true;
  }
  init.call(this, options);
}

//processing context
tributary.ProcessingContext = function(options) {
  this.execute = function() {
    if(tributary.__noupdate__) return;
    var pde = this.model.get("code");
    var js = Processing.compile(pde).sourceCode;

    try {
      var fn = eval(js);
      if(tributary.__processing__) tributary.__processing__.exit();
      tributary.__processing__ = new Processing(tributary.canvas, fn);
    } catch (e) {
      this.model.trigger("error", e);
      return false;
    }
    this.model.trigger("noerror");
    return true;
  }
  init.call(this, options);
}

//JSON Context
//The JSON context evaluates json and sets the result to
//tributary.foo where foo is the name of the context
//i.e. the filename without the extension
tributary.JSONContext = function(options) {
  this.execute = function() {
    if(tributary.__noupdate__) return;
    try {
      var json = JSON.parse(this.model.get("code"));
      tributary[this.model.get("name")] = json;
    } catch (e) {
      this.model.trigger("error", e);
      return false;
    }
    this.model.trigger("noerror");
    return true;
  }
  init.call(this, options);
}

//The CSV context evaluates js in the global namespace
tributary.CSVContext = function(options) {
  this.execute = function() {
    if(tributary.__noupdate__) return;
    try {
      var json = d3.csv.parse(this.model.get("code"));
      tributary[this.model.get("name")] = json;
    } catch (e) {
      this.model.trigger("error", e);
      return false;
    }
    this.model.trigger("noerror");
    return true;
  }
  init.call(this, options);
}

//The TSV context evaluates js in the global namespace
tributary.TSVContext = function(options) {
  this.execute = function() {
    if(tributary.__noupdate__) return;
    try {
      var json = d3.tsv.parse(this.model.get("code"));
      tributary[this.model.get("name")] = json;
    } catch (e) {
      this.model.trigger("error", e);
      return false;
    }
    this.model.trigger("noerror");
    return true;
  }
  init.call(this, options);
}

//The CSS context adds a style element to the head with the contents of the css
tributary.CSSContext = function(options) {
  this.execute = function() {
    if(tributary.__noupdate__) return;
    try {
      //set the text of the style element to the code
      this.el.textContent = this.model.get("code");
    } catch (e) {
      this.model.trigger("error", e);
      return false;
    }
    this.model.trigger("noerror");
    return true;
  }

  this.render = function() {
    //we create a style element for the model in the head
    this.el = d3.select("head")
      .selectAll("style.csscontext")
      .data([this.model], function(d) { return d.cid })
      .enter()
      .append("style")
      .classed("csscontext", true)
      .attr({
        type:"text/css"
      }).node();
  }
  init.call(this, options);
  this.model.on("delete", function() {
    d3.select(this.el).remove();
  }, this)
}

tributary.HTMLContext = function(options) {
  this.execute = function() {
    if(tributary.__noupdate__) return;
    try {
      //set the text of the style element to the code
      $(this.el).append(this.model.get("code"));
    } catch (e) {
      this.model.trigger("error", e);
      return false;
    }
    this.model.trigger("noerror");
    return true;
  }
  init.call(this, options);
}

tributary.SVGContext = function(options) {
  this.execute = function() {
    if(tributary.__noupdate__) return;
    try {
      var svg = d3.select(this.el).select("svg").node();
      if(!svg) {
        svg = d3.select(this.el).append("svg")
      }
      //TODO: validate the SVG?
      //this should happen before code from inlet gets executed
      tributary.appendSVGFragment(svg, this.model.get("code"));
    } catch (e) {
      this.model.trigger("error", e);
      return false;
    }
    this.model.trigger("noerror");
    return true;
  }
  init.call(this, options);
}

tributary.TextContext = function(options) {
  this.execute = function() {
    if(tributary.__noupdate__) return;
    this.model.trigger("noerror");
    return true;
  }
  init.call(this, options);
}
