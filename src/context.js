
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
    this.model.on("change:code", this.execute, this);
    this.config = this.options.config;

    tributary.init = undefined;
    tributary.run = undefined;


    //default parameters for this context
    tributary.pause = true;
    //tributary.autoplay = true;
    //tributary.autoinit = true;
    tributary.reverse = false;
    tributary.loop = "period"; //["off", "period", "pingpong"]
    tributary.bv = false;
    tributary.nclones = 15;
    tributary.clonse_opacity = 0.4;
    tributary.duration = 3000;
    tributary.t = 0;
    tributary.ease = d3.ease("linear");

    tributary.render = function() {};
    
    var that = this;

    //we need to save state of timer so when we pause/unpause or manually change slider
    //we can finish a transition
    that.timer = {
        then: new Date(),
        duration: tributary.duration,
        ctime: tributary.t
    };

    d3.timer(function() {
      tributary.render()
      //if paused lets not execute
      if(tributary.pause) { return false; }

      var now = new Date();
      var dtime = now - that.timer.then;
      var dt;
      if (that.reverse) {
          dt = that.timer.ctime * dtime / that.timer.duration * -1;
      } else {
          dt = (1 - that.timer.ctime) * dtime / that.timer.duration;
      }
      tributary.t = that.timer.ctime + dt;
      

      if(tributary.loops) {
        //once we reach 1, lets pause and stay there
        if(tributary.t >= 1 || tributary.t <= 0 || tributary.t === "NaN")
        {
          if(that.loop === "period") {
            tributary.t = 0;
            that.timer.then = new Date();
            that.timer.duration = tributary.duration;
            that.timer.ctime = tributary.t;
            that.reverse = false;
            //tributary.pause = false;
          } else if (that.loop === "pingpong") {
            //this sets tributary.t to 0 when we get to 0 and 1 when we get to 1 (because of the direction we were going)
            tributary.t = !that.reverse;
            that.timer.then = new Date();
            that.timer.duration = tributary.duration;
            that.timer.ctime = tributary.t;
            that.reverse = !that.reverse;
          }
          else {
            if (tributary.t !== 0)
            {
                tributary.t = 1;
                tributary.pause = true;
            }
          }
        }
        //not sure why we get true and false for 1 and 0 when range hits the end
        if(tributary.t === true) { tributary.t = 1; }
        if(tributary.t === false) { tributary.t = 0; }
   
        //move the slider
        $('#slider').attr('value', tributary.t);
      }
      
      if(tributary.run !== undefined) {
        var t = tributary.t;
        if(tributary.loops) {
          t = tributary.ease(tributary.t); 
        }
        tributary.run(that.g, t, 0);
      }
    });
 
  },

  execute: function() {   
    var js = this.model.handle_coffee();
    var that = this;
    try {
        tributary.initialize = new Function("g", js);
        tributary.initialize(this.g);
    } catch (e) {
        this.model.trigger("error", e);
        return false;
    }

    if(tributary.bv) {
        //d3.selectAll(".bvclone").remove(); 
        try {
          $(this.clones.node()).empty();
          this.make_clones();
        } catch (er) {
          this.model.trigger("error", er);
        }
      }

    try {
        //for the datGUI stuff
        //TODO: move this out of here to it's own function
        window.trib = {};               //reset global trib object
        window.trib_options = {};       //reset global trib_options object
        trib = window.trib;
        trib_options = window.trib_options;

        //empty out our display element
        tributary.clear();

        //execute the code
        tributary.initialize(this.g);

        if(tributary.autoinit && tributary.init !== undefined) {
          tributary.init(this.g, 0);
        }
        //then we run the user defined run function
        //tributary.execute();
        if(tributary.run !== undefined) {
          tributary.run(this.g, tributary.ease(tributary.t), 0);
        }
    } catch (err) {
        this.model.trigger("error", err);
        return false;
    }
    this.model.trigger("noerror");

    return true;
  },

  render: function() {

  //check config for display to use
  var display = this.config.get("display");
  if(display === "svg") {
      this.make_svg();
    } else if (display === "canvas") {
      this.make_canvas(); 
    } else if (display === "webgl") {
      this.make_webgl();
    } else if (display === "div") {
      tributary.clear = function() {
          this.$el.empty();
      };
    } else {
      tributary.clear = function() {
          this.$el.empty();
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
    this.g = this.svg;

    var that = this;
    tributary.clear = function() {
      $(that.g.node()).empty();
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
    this.g = tributary.ctx;

  },

  make_clones: function() {
    this.clones = this.svg.append("g").attr("id", "clones");
    this.g = this.svg.append("g").attr("id", "delta");
 
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




tributary.JSONContext = tributary.Context.extend({

  initialize: function() {
    this.model.on("code", this.execute, this);
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



