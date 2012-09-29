
//Playing with time

tributary.DeltaContext = Backbone.View.extend({

  initialize: function() {
    this.model.on("change:code", this.execute, this);

    //default parameters for this context
    //TODO: make all of these configurable
    this.pause = true;
    this.reverse = false;
    this.loop = "period"; //["off", "period", "pingpong"]
    this.bv = false;
    this.nclones = 15;
    this.clonse_opacity = 0.4;
    this.duration = 3000;
    this.t = 0;
    this.ease = d3.ease("linear");
    
    tributary.init = function(g,t,i) {};
    tributary.run = function(g,t,i) {};

    var that = this;

    //we need to save state of timer so when we pause/unpause or manually change slider
    //we can finish a transition
    that.timer = {
        then: new Date(),
        duration: that.duration,
        ctime: that.t
    };

    d3.timer(function() {
      //if paused lets not execute
      if(that.pause) { return false; }

      var now = new Date();
      var dtime = now - that.timer.then;
      var dt;
      if (that.reverse) {
          dt = that.timer.ctime * dtime / that.timer.duration * -1;
      }
      else {
          dt = (1 - that.timer.ctime) * dtime / that.timer.duration;
      }
      that.t = that.timer.ctime + dt;
      

      //once we reach 1, lets pause and stay there
      if(that.t >= 1 || that.t <= 0 || that.t === "NaN")
      {
          if(that.loop === "period") {
              that.t = 0;
              that.timer.then = new Date();
              that.timer.duration = that.duration;
              that.timer.ctime = that.t;
              that.reverse = false;
              //that.pause = false;
          } else if (that.loop === "pingpong") {
              //this sets that.t to 0 when we get to 0 and 1 when we get to 1 (because of the direction we were going)
              that.t = !that.reverse;
              that.timer.then = new Date();
              that.timer.duration = that.duration;
              that.timer.ctime = that.t;
              that.reverse = !that.reverse;
          }
          else {
              if (that.t !== 0)
              {
                  that.t = 1;
                  that.pause = true;
              }
          }
      }

      //not sure why we get true and false for 1 and 0 when range hits the end
      if(that.t === true) { that.t = 1; }
      if(that.t === false) { that.t = 0; }
      
      //move the slider
      $('#slider').attr('value', that.t);
      
      tributary.run(that.g, that.ease(that.t), 0);
    });


  },

  execute: function() {   
    var js = this.model.handle_coffee();
    try {
        tributary.initialize = new Function("g", js);
        tributary.initialize();
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

        //empty out our svg element
        $(this.g.node()).empty();

        //execute the code
        tributary.init(this.g, 0);
        //then we run the user defined run function
        //tributary.execute();
        tributary.run(this.g, this.ease(this.t), 0);

    } catch (err) {
        this.model.trigger("error", err);
        return false;
    }
    this.model.trigger("noerror");
    return true;
  },


  render: function() {
    //Use mustache or other templates here? naaah...
    this.svg = d3.select(this.el).append("svg")
      .attr({
        "xmlns":"http://www.w3.org/2000/svg",
        //this usually requires xmlns:xlink but chrome wont let me add that
        "xlink":"http://www.w3.org/1999/xlink",
        class:"tributary_svg"       
      });

    this.clones = this.svg.append("g").attr("id", "clones");
    this.g = this.svg.append("g").attr("id", "delta");
  },
  
  make_clones: function() {
    //make n frames with lowered opacity
    var frames = d3.range(this.nclones);
    var gf = this.clones.selectAll("g.bvclone")
        .data(frames).enter()
        .append("g")
            .attr("class", "bvclone")
            .style("opacity", this.clone_opacity);

    gf.each(function(d, i) {
        var j = i+1;
        var frame = d3.select(this);
        tributary.init(frame, j);
        //tributary.run(i/tributary.nclones, frame, i);
        var t = this.ease(j/(this.nclones+1));
        tributary.run(frame, t, j);
    });
  },

 });

