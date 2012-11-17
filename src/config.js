
//The config model is the glue that binds together a particular configurtion
//of tributary components
tributary.Config = Backbone.Model.extend({
  defaults: {        
      description: "Another Inlet",
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
  initialize: function() {

  },

  render: function() {
    //TODO: split each of the sections into their own view? 
    //at least the require stuff probably
    var that = this;

    var template = Handlebars.templates.config;
    //inlet.js comes first
    
    var context ={
      displays: tributary.displays, 
      time_controls: tributary.time_controls,
      requires: this.model.get("require")
    };

    $(this.el).html(template(context));



    var displays = d3.select(this.el)
      .select(".displaycontrols")
      .selectAll("div.config");

    var initdisplay = this.model.get("display");
    displays.map(function() { return this.dataset; })
    displays.filter(function(d) {
      return d.name === initdisplay;
    })
    .classed("config_active", true);

    displays.on("click", function(d) {
      d3.select(this.parentNode).selectAll("div.config")
        .classed("config_active", false);
      d3.select(this).classed("config_active", true);
      that.model.set("display", d.name);
      tributary.events.trigger("execute");
    });

    var timecontrols = d3.select(this.el)
      .select(".timecontrols")
      .selectAll("div.config");

    timecontrols.map(function() { return this.dataset; })
    timecontrols.filter(function(d) {
      return that.model.get(d.name);
    })
    .classed("config_active", true);

    timecontrols.on("click", function(d) {
      //TODO: make this data driven
      var tf = !that.model.get(d.name);
      d3.select(this).classed("config_active", tf);
      //TODO: set time controls in config
      //that.model.set("display", d.name);
      that.model.set(d.name, tf);
    });


    var require = d3.select(this.el)
      .select(".requirecontrols");

    var plus = require
      .selectAll(".plus");
    var add= require
      .selectAll(".tb_add");


    var name_input = require.select(".tb_add")
      .select("input.name");
    var url_input = require.select(".tb_add")
      .select("input.url");

    require.selectAll("div.config")
      .datum(function() { return this.dataset; })
      .select("span.delete")
        .datum(function() { return this.dataset; })
        .on("click", function(d) {
          var reqs = that.model.get("require");
          var ind = reqs.indexOf(d);
          reqs.splice(ind, 1);
          that.model.set("require", reqs);

          //rerender
          that.$el.empty();
          that.render();

          add.style("display", "none");
        });


    require.selectAll("div.config")
      .on("click", function(d) {
        add.style("display", "");
        name_input.node().value = d.name;
        url_input.node().value = d.url;

        //update the appropraite req
        var done = function() {
          //create a new require

          
          var reqs = that.model.get("require");
          var req = _.find(reqs, function(r) { return r.name === d.name; });
          req.name = name_input.node().value;
          req.url = url_input.node().value;

          that.model.set("require", reqs);
          that.model.require(function() {}, reqs);
          
          //rerender the files view to show new file
          that.$el.empty();
          //console.log(that);
          that.render();
        };

        name_input.on("keypress", function() {
          //they hit enter
          if(d3.event.charCode === 13) {
            done();
          }
        });
        url_input.on("keypress", function() {
          //they hit enter
          if(d3.event.charCode === 13) {
            done();
          }
        });
      })

    plus.on("click", function() {
      add.style("display", "");
      name_input.node().focus();
      var done = function() {
        //create a new require
        var req = { 
          name: name_input.node().value,
          url: url_input.node().value
        };
        var reqs = that.model.get("require");
        reqs.push(req);
        that.model.set("require", reqs);
        that.model.require(function() {}, reqs);
        
        //rerender the files view to show new file
        that.$el.empty();
        console.log(that);
        that.render();
      };

      name_input.on("keypress", function() {
        //they hit enter
        if(d3.event.charCode === 13) {
          done();
        }
      });
      url_input.on("keypress", function() {
        //they hit enter
        if(d3.event.charCode === 13) {
          done();
        }
      });
    });
 

    /*

      
    
    //Add require.js UI
    
    var requireUI = d3.select(this.el).append("div").attr("id", "require-ui")
    requireUI.append("span")
      .classed("config_title", true)
      .text("Require:");
     
    var rc = requireUI.append("div")
      .classed("requirecontrols", true);
    var rcs = rc 
      .selectAll("div.config")
      .data(this.model.get("require"))
      .enter()
      .append("div")
      .classed("config", true);

    rcs.append("span")
      .text(function(d) { return d.name; });
    rcs.append("span")
      .text(function(d) { return " " + d.url; })
      .classed("description", true);
    rcs.append("span")
      .text("x")
      .classed("delete", true)
      .on("click", function(d) {
        var reqs = that.model.get("require");
        var ind = reqs.indexOf(d);
        reqs.splice(ind, 1);
        that.model.set("require", reqs);

        //rerender
        that.$el.empty();
        that.render();
      });

    //add the + button
    var plus = rc.append("div")
      .classed("config", true);

    plus.append("span")
      .text("+ ");

    //add and hide the inputs for a new require
    var name_input = plus.append("div").text("name: ")
      .style({
        display: "none"
      });
    name_input
      .append("input")
      .attr({
        type: "text"
      });
      
    var url_input = plus.append("div").text("url: ")
      .style({
        display: "none"
      });
    url_input
      .append("input")
      .text("url:")
      .attr({
        type: "text"
      });
    
    plus.on("click", function() {
      name_input
        .style("display","");
      url_input
        .style("display","");
      name_input.select("input").node().focus();
      var done = function() {
        //create a new require
        var req = { name: name_input.select("input").node().value,
          url: url_input.select("input").node().value
        };
        var reqs = that.model.get("require");
        reqs.push(req);
        that.model.set("require", reqs);
        
        //rerender the files view to show new file
        that.$el.empty();
        console.log(that);
        that.render();
      };

      name_input.on("keypress", function() {
        //they hit enter
        if(d3.event.charCode === 13) {
          done();
        }
      });
      url_input.on("keypress", function() {
        //they hit enter
        if(d3.event.charCode === 13) {
          done();
        }
      });
    });
    */
  }
});

