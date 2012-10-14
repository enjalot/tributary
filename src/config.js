
//The config model is the glue that binds together a particular configurtion
//of tributary components
tributary.Config = Backbone.Model.extend({
  defaults: {        
      endpoint: "tributary",
      display: "svg",
      public: true,
      require: [], //require modules will be like : {name:"crossfilter", url:"/static/lib/crossfilter.min.js"}
      tab: "edit",
      display_percent: 0.7,

      //things related to time control
      play: false,
      loop: false,
      restart: false,
      //time options
      autoinit: true,
      pause: true,
      loop_type: "period", //["off", "period", "pingpong"]
      bv: false,
      nclones: 15,
      clone_opacity: 0.4,
      duration: 3000,
      ease: "linear",
      dt: 0.01,

  },

  require: function(callback, ret) {
    //load scripts from the require array with require.js
    var modules = this.get("require");
    var scripts = _.pluck(modules, "url");

    var rcb = function() {
      return callback(ret, arguments);
    };
    require(scripts, rcb);
  },

  initialize: function() {
    //convenience event to trigger a hide event on all contexts (and thus their editors)
    this.on("hide", function() {
      this.contexts.forEach(function(context) {
        context.model.trigger("hide");
      });
    }, this);

  }


});

////////////////////////////////////////////////////////////////////////
// Config UI
////////////////////////////////////////////////////////////////////////
tributary.ConfigView = Backbone.View.extend({

  render: function() {
    //TODO: split each of the sections into their own view? 
    //at least the require stuff probably
    var that = this;
    //show options for the various renderers (displays)
    d3.select(this.el).append("span")
      .classed("config_title", true)
      .text("Display:");
      

    var displays = d3.select(this.el).append("div")
      .classed("displaycontrols", true)
      .selectAll("div.config")
      .data(tributary.displays)
      .enter()
      .append("div")
      .classed("config", true);

    var initdisplay = this.model.get("display");
    displays.each(function(d) {
      //console.log(d.name, initdisplay);
      if(d.name === initdisplay) { d3.select(this).classed("config_active",true); }
    });
    displays.append("span")
      .text(function(d) { return d.name; });
    displays.append("span")
      .text(function(d) { return " " + d.description; })
      .classed("description", true);


    displays.on("click", function(d) {
      d3.select(this.parentNode).selectAll("div.config")
        .classed("config_active", false);
      d3.select(this).classed("config_active", true);
      that.model.set("display", d.name);
    });



    //show options for time controls
    d3.select(this.el).append("span")
      .classed("config_title", true)
      .text("Time Controls:");
     
    var tcs = d3.select(this.el).append("div")
      .classed("timecontrols", true)
      .selectAll("div.config")
      .data(tributary.time_controls)
      .enter()
      .append("div")
      .classed("config", true);

    //TODO: set active for options active in config
    tcs.each(function(d) {
      if(that.model.get(d.name)) { d3.select(this).classed("config_active", true); }
    });
    
    tcs.append("span")
      .text(function(d) { return d.name; });
    tcs.append("span")
      .text(function(d) { return " " + d.description; })
      .classed("description", true);

    tcs.on("click", function(d) {
      //TODO: make this data driven
      var tf = !that.model.get(d.name);
      d3.select(this).classed("config_active", tf);
      //TODO: set time controls in config
      //that.model.set("display", d.name);
      that.model.set(d.name, tf);
    });
    


  }

});

