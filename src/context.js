
//The Context is the essential part of tributary, it is what makes assumptions
//about the code and provides the context for the code to execute.

//The primary purpose of the context will be to supply the event handler for the 
//execute event from the code model
tributary.Context = Backbone.View.extend({
  initialize: function() {},
  execute: function() {},
  render: function() {}
});


tributary.TributaryContext = tributary.Context.extend({

  initialize: function() {
    //this.model.on("change:code", this.execute, this);
    this.model.on("change:code", function() {
      tributary.events.trigger("execute");
    });
    tributary.events.on("execute", this.execute, this);

    if(!tributary.__config__) {
      if(this.options.config) {
        tributary.__config__ = this.options.config;
      } else {
        tributary.__config__ = new tributary.Config();
      }
    }

    //if the user has modified the code, we want to protect them from losing their work
    this.model.on("change:code", function() {
      //TODO: use CodeMirror .isClean / .markClean when switch to v3 
      tributary.events.trigger("warnchanged");
    }, this);
    //allow other context's to make this code execute
    //tributary.events.on("execute", this.execute, this);

    this.config = tributary.__config__;
    this.config.on("change:display", this.set_display, this);
    var config = this.config;

    tributary.init = undefined;
    tributary.run = undefined;
  
    //autoinit determins whether we call tributary.init by default
    tributary.autoinit = config.get("autoinit");

    tributary.render = function() {};
    tributary.execute = function() {};
     
  },

  execute: function() {   
    if(tributary.__noupdate__) return;
    try {
      var js = this.model.handleCoffee();
    } catch (e) {
      this.model.trigger("error", e);
      return false;
    }

    try {
      //eval(js);
      tributary.initialize = new Function("g", "tributary", js);
      //tributary.initialize(tributary.g);
    } catch (e) {
      this.model.trigger("error", e);
      return false;
    }

    try {
      
      //empty out our display element
      if(tributary.autoinit) {
        tributary.clear();
        //call anything that needs to be prerendered (SVG and HTML contexts)
        tributary.events.trigger("prerender");
      }
      if(tributary.ctx && !tributary.g) {
        //somehow tributary.g ends up undefined...
      //  tributary.g = tributary.ctx;
      }

      //execute the code
      tributary.initialize(tributary.g, tributary);

      if(tributary.autoinit && tributary.init !== undefined) {
        tributary.init(tributary.g, 0);
      }
      //then we run the user defined run function
      tributary.execute();
    } catch (err) {
        this.model.trigger("error", err);
        return false;
    }
    this.model.trigger("noerror");

    return true;
  },

  render: function() {
    //check config for display to use
    this.set_display(); 
  },

  set_display: function() {
    var that = this;
    this.$el.empty();
    var display = this.config.get("display");
    if(display === "svg") {
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
    //Use mustache or other templates here? naaah...
    this.svg = d3.select(this.el).append("svg")
      .attr({
        "xmlns":"http://www.w3.org/2000/svg",
        //this usually requires xmlns:xlink but chrome wont let me add that
        "xlink":"http://www.w3.org/1999/xlink",
        class:"tributary_svg",
        width: "100%",
        height: "100%"
      });
    tributary.g = this.svg;
    tributary.__svg__ = this.svg;

    tributary.clear = function() {
      $(tributary.__svg__.node()).empty();
      //this handles delta (clones)
      //$(tributary.svg.node()).empty();
    };

  },

  make_canvas: function() {
    tributary.clear = function() {
      //var sw = parseInt(d3.select("#display").style("width"));
      //var sh = parseInt(d3.select("#display").style("height"));
      tributary.canvas.width = tributary.sw;
      tributary.canvas.height = tributary.sh;
      tributary.ctx.clearRect(0, 0, tributary.sw, tributary.sh);
    };

    tributary.canvas = d3.select(this.el).append("canvas")
      .classed("tributary_canvas",true)
      .node();
    tributary.ctx = tributary.canvas.getContext('2d');
    tributary.g = tributary.ctx;
  },

  make_webgl: function() {
    container = this.el;

    tributary.camera = new THREE.PerspectiveCamera( 70, tributary.sw / tributary.sh, 1, 1000 );
    tributary.camera.position.y = 150;
    tributary.camera.position.z = 500;

    tributary.scene = new THREE.Scene();

    THREE.Object3D.prototype.clear = function(){
      var children = this.children;
      var i;
      for(i = children.length-1;i>=0;i--){
        var child = children[i];
        child.clear();
        this.remove(child);
      }
    };
    tributary.renderer = new THREE.WebGLRenderer();
    //tributary.renderer = new THREE.CanvasRenderer();
    tributary.renderer.setSize( tributary.sw, tributary.sh );

    container.appendChild( tributary.renderer.domElement );

    /*
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.right = '0px';
    stats.domElement.style.top = '0px';
    container.appendChild( stats.domElement );
    */
    //tributary.renderer.render( tributary.scene, tributary.camera );

    /*
    var controls = new THREE.TrackballControls( tributary.camera );
    controls.target.set( 0, 0, 0 );
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;

    controls.noZoom = false;
    controls.noPan = false;

    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.15;

    tributary.controls = controls;
    */
    

    tributary.render = function() {
      if(tributary.useThreejsControls) {
        //tributary.controls.update();
      }
      tributary.renderer.render( tributary.scene, tributary.camera );
    };
    tributary.render();
    
    function onWindowResize() {

      windowHalfX = tributary.sw / 2;
      windowHalfY = tributary.sh / 2;

      tributary.camera.aspect = tributary.sw / tributary.sh;
      tributary.camera.updateProjectionMatrix();

      tributary.renderer.setSize( tributary.sw, tributary.sh );

    }
    tributary.events.on("resize", onWindowResize, false);
    //window.addEventListener( 'resize', onWindowResize, false );

    tributary.clear = function() {
      tributary.scene.clear();
    };

  }

});


//JSON Context
//The JSON context evaluates json and sets the result to
//tributary.foo where foo is the name of the context 
//i.e. the filename without the extension
tributary.JSONContext = tributary.Context.extend({

  initialize: function() {
    this.model.on("change:code", this.execute, this);
    this.model.on("change:code", function() {
      tributary.events.trigger("execute");
    });
  },

  execute: function() {
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
  },

  render: function() {
    //JSON context doesn't do anything on rendering
  },

});


//The JS context evaluates js in the global namespace
//TODO: doesn't seem to really be global, need to use tributary object...
tributary.JSContext = tributary.Context.extend({
  initialize: function() {
    this.model.on("change:code", this.execute, this);
    this.model.on("change:code", function() {
      tributary.events.trigger("execute");
    });
  },

  execute: function() {
    if(tributary.__noupdate__) return;
    var js = this.model.get("code");

    try {
      eval(js);
    } catch (e) {
      this.model.trigger("error", e);
      return false;
    }
    this.model.trigger("noerror");

    return true;
  },

  render: function() {
    //JS context doesn't do anything on rendering
  },

});

//Coffeescript Context
tributary.CoffeeContext = tributary.Context.extend({
  initialize: function() {
    //TODO: add this in as a pattern for all contexts? or just make a better way of wiring up events period.
    if(!this.options.silent) {
      this.model.on("change:code", this.execute, this);
    }
    this.model.on("change:code", function() {
      tributary.events.trigger("execute");
    });
  },

  execute: function() {
    if(tributary.__noupdate__) return;
    try {
      var js = this.model.handleCoffee();
    } catch(err) {
      this.model.trigger("error", err);
      return false;
    }
    //TODO: use coffee compilation to give errors/warnings
    /*
    if(js.length > 0) {
      var hints = JSHINT(js, {
        asi: true,
        laxcomma: true,
        laxbreak: true,
        loopfunc: true,
        smarttabs: true,
        sub: true
      })
      if(!hints) {
        this.model.trigger("jshint", JSHINT.errors);
        //for now, we can let the user continue incase JSHINT is too strict
        //this.model.trigger("error", null);
        //return false;
      } else {
        this.model.trigger("nojshint");
      }
    }
    */

    try {
      eval(js);
    } catch (err) {
      this.model.trigger("error", err);
      return false;
    }
    this.model.trigger("noerror");

    return true;
  },

  render: function() {
    //JS context doesn't do anything on rendering
  },

});


//The CSV context evaluates js in the global namespace
tributary.CSVContext = tributary.Context.extend({
  initialize: function() {
    this.model.on("change:code", this.execute, this);
    this.model.on("change:code", function() {
      tributary.events.trigger("execute");
    });
  },

  execute: function() {
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
  },

  render: function() {
    //CSV context doesn't do anything on rendering
  },
});

//The TSV context evaluates js in the global namespace
tributary.TSVContext = tributary.Context.extend({
  initialize: function() {
    this.model.on("change:code", this.execute, this);
    this.model.on("change:code", function() {
      tributary.events.trigger("execute");
    });
  },

  execute: function() {
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
  },

  render: function() {
    //TSV context doesn't do anything on rendering
  },
});




//The CSS context adds a style element to the head with the contents of the css
tributary.CSSContext = tributary.Context.extend({
  initialize: function() {
    this.model.on("change:code", this.execute, this);
    this.model.on("change:code", function() {
      tributary.events.trigger("execute");
    });
    tributary.events.on("prerender", this.execute, this);
    this.model.on("delete", function() {
      d3.select(this.el).remove();
    }, this)
  },

  execute: function() {
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
  },

  render: function() {
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
    //console.log("style el", this.el);

  }

});

tributary.HTMLContext = tributary.Context.extend({
  initialize: function() {
    //this.model.on("change:code", this.execute, this);
    this.model.on("change:code", function() {
      tributary.events.trigger("execute");
    });
    tributary.events.on("prerender", this.execute, this);
  },

  execute: function() {
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
  },

  render: function() {
  },
});

//TODO: figure out how to make this useful
tributary.SVGContext = tributary.Context.extend({
  initialize: function() {
    //this.model.on("change:code", this.execute, this);
    this.model.on("change:code", function() {
      tributary.events.trigger("execute");
    });
    tributary.events.on("prerender", this.execute, this);
  },

  execute: function() {
    if(tributary.__noupdate__) return;
    try {
      //TODO: validate the SVG?
      var svg = d3.select(this.el).select("svg").node();
      //this should happen before code from inlet gets executed
      //$(svg).append("<svg class='injected'>" + this.model.get("code") + "</svg>");
      tributary.appendSVGFragment(svg, this.model.get("code"));
    } catch (e) {
      this.model.trigger("error", e);
      return false;
    }
    this.model.trigger("noerror");

    return true;
  },

  render: function() {
  },

});


//The Text context doesn't do anything
tributary.TextContext = tributary.Context.extend({
  initialize: function() {
    this.model.on("change:code", this.execute, this);
    this.model.on("change:code", function() {
      tributary.events.trigger("execute");
    });
  },

  execute: function() {
    if(tributary.__noupdate__) return;
    this.model.trigger("noerror");

    return true;
  },

  render: function() {
    //Text context doesn't do anything on rendering
  },
});




