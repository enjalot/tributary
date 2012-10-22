
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
    //
    this.model.on("change:code", this.execute, this);
    //allow other context's to make this code execute
    tributary.events.on("execute", this.execute, this);

    this.config = this.options.config;
    this.config.on("change:display", this.set_display, this);
    var config = this.config;

    tributary.init = undefined;
    tributary.run = undefined;

    //time controls;
    tributary.loop = config.get("loop");
    tributary.autoinit = config.get("autoinit");

    //default parameters for this context
    tributary.pause = config.get("pause"); //pause is used to pause and unpause
    //tributary.autoplay = true;
    //tributary.autoinit = true;
    tributary.loop_type = config.get("loop_type"); //["off", "period", "pingpong"]
    tributary.bv = config.get("bv");
    tributary.nclones = config.get("nclones");
    tributary.clone_opacity = config.get("clone_opacity");
    tributary.duration = config.get("duration");
    tributary.ease = d3.ease(config.get("ease"));
    tributary.t = 0;
    tributary.dt = config.get("dt");
    tributary.reverse = false;

    tributary.render = function() {};
    //convenience function
    tributary.execute = function() {
      if(tributary.run !== undefined) {
        var t = tributary.t;
        if(tributary.loop) {
          t = tributary.ease(tributary.t); 
        }
        tributary.run(tributary.g, t, 0);
      }
    }

    //we need to save state of timer so when we pause/unpause or manually change slider
    //we can finish a transition
    tributary.timer = {
        then: new Date(),
        duration: tributary.duration,
        ctime: tributary.t
    };

    d3.timer(function() {
      tributary.render();
      //if paused lets not execute
      if(tributary.pause) { return false; }

      var now = new Date();
      var dtime = now - tributary.timer.then;
      var dt;
            
      //TODO: implement play button, should reset the timer
      if(tributary.loop) {
        if (tributary.reverse) {
            dt = tributary.timer.ctime * dtime / tributary.timer.duration * -1;
        } else {
            dt = (1 - tributary.timer.ctime) * dtime / tributary.timer.duration;
        }
        tributary.t = tributary.timer.ctime + dt;

        //once we reach 1, lets pause and stay there
        if(tributary.t >= 1 || tributary.t <= 0 || tributary.t === "NaN")
        {
          if(tributary.loop_type === "period") {
            tributary.t = 0;
            tributary.timer.then = new Date();
            tributary.timer.duration = tributary.duration;
            tributary.timer.ctime = tributary.t;
            tributary.reverse = false;
            //tributary.pause = false;
          } else if (tributary.loop_type === "pingpong") {
            //this sets tributary.t to 0 when we get to 0 and 1 when we get to 1 (because of the direction we were going)
            tributary.t = !tributary.reverse;
            tributary.timer.then = new Date();
            tributary.timer.duration = tributary.duration;
            tributary.timer.ctime = tributary.t;
            tributary.reverse = !tributary.reverse;
          }
          else {
            if (tributary.t !== 0)
            {
                tributary.t = 1;
                tributary.pause = true;
            }
          }
        } 
        //TODO: fix, look up 10 lines to pingpong
        //not sure why we get true and false for 1 and 0 when range hits the end
        if(tributary.t === true) { tributary.t = 1; }
        if(tributary.t === false) { tributary.t = 0; }
   
        //move the slider
        //$('#slider').attr('value', tributary.t);
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
      //eval(js);
      tributary.initialize = new Function("g", "tributary", js);
      //tributary.initialize(tributary.g);
    } catch (e) {
        this.model.trigger("error", e);
        return false;
    }

    try {
        //for the datGUI stuff
        //TODO: move this out of here to it's own function
        window.trib = {};               //reset global trib object
        window.trib_options = {};       //reset global trib_options object
        trib = window.trib;
        trib_options = window.trib_options;

        //empty out our display element
        if(tributary.autoinit) {
          tributary.clear();
        }

        if(this.clones) { $(this.clones.node()).empty(); }
        if(tributary.bv) {
          this.make_clones();
        }

        //execute the code
        //eval(js);
        tributary.initialize(tributary.g, tributary);

        if(tributary.autoinit && tributary.init !== undefined) {
          tributary.init(tributary.g, 0);
        }
        //then we run the user defined run function
        tributary.execute();
        /*
        if(tributary.run !== undefined) {
          tributary.run(tributary.g, tributary.ease(tributary.t), 0);
        }
        */
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
        class:"tributary_svg"       
      });
    tributary.g = this.svg;

    tributary.clear = function() {
      $(tributary.g.node()).empty();
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

  //TODO: make canvas clones
  make_clones: function() {
    //create the clone and delta g elements if they don't exist
    this.clones = this.svg.selectAll("g.clones")
      .data([0]);
    this.clones
      .enter()
      .append("g").attr("class", "clones");
    tributary.g = this.svg.selectAll("g.delta")
      .data([0]);
    tributary.g
      .enter()
      .append("g").attr("class", "delta");
 
    //make n frames with lowered opacity
    var frames = d3.range(tributary.nclones);
    var gf = this.clones.selectAll("g.bvclone")
        .data(frames).enter()
        .append("g")
            .attr("class", "bvclone")
            .style("opacity", tributary.clone_opacity);

    gf.each(function(d, i) {
        var j = i+1;
        var frame = d3.select(this);
        tributary.init(frame, j);
        //tributary.run(i/tributary.nclones, frame, i);
        var t = tributary.ease(j/(tributary.nclones+1));
        tributary.run(frame, t, j);
    });
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

    tributary.render = function() {
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
    try {
      eval(this.model.get("code"));
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

//The CS context evaluates coffeescript in the global namespace.
tributary.CSContext = tributary.Context.extend({
  initialize: function() {
    this.model.on("change:code", this.execute, this);
    this.model.on("change:code", function() {
      tributary.events.trigger("execute");
    });
  },
  execute: function() {
    try {
      eval(this.model.handle_coffee());
    } catch (e) {
      this.model.trigger("error", e);
      return false;
    }
    this.model.trigger("noerror");
    return true;
  },
  render: function() {}
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


//The CSS context adds a style element to the head with the contents of the css
tributary.CSSContext = tributary.Context.extend({
  initialize: function() {
    this.model.on("change:code", this.execute, this);
    this.model.on("change:code", function() {
      tributary.events.trigger("execute");
    });
  },

  execute: function() {
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
    console.log("style el", this.el);

  },

});

//TODO: figure out how to make this useful
tributary.HTMLContext = tributary.Context.extend({
  initialize: function() {
    this.model.on("change:code", this.execute, this);
    this.model.on("change:code", function() {
      tributary.events.trigger("execute");
    });
  },

  execute: function() {
    try {
      //set the text of the style element to the code
      $(this.el).html(this.model.get("code"));
    } catch (e) {
      this.model.trigger("error", e);
      return false;
    }
    this.model.trigger("noerror");

    return true;
  },

  render: function() {
    this.el = d3.select("body")
      .selectAll("div.htmlcontext")
      .data([this.model], function(d) { return d.cid })
      .enter()
      .append("div")
      .classed("htmlcontext", true)
      .node();

    
  },

});


