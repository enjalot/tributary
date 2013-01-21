
//The config model is the glue that binds together a particular configurtion
//of tributary components
tributary.Config = Backbone.Model.extend({
  defaults: {
      description: "Tributary inlet",
      endpoint: "tributary",
      display: "svg",
      public: true,
      require: [], //require modules will be like : {name:"crossfilter", url:"/static/lib/crossfilter.min.js"}
      fileconfigs: {}, //per-file configurations (editor specific)

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

    var displaySelect = d3.select(this.el).select("#config-content select")
      .on("change", function() {
        var display = this.selectedOptions[0].value;
        that.model.set("display", display);
        tributary.events.trigger("execute");
      })

    var currentDisplay = this.model.get("display");
    displaySelect.selectAll("option")
      .each(function(d,i) {
        if(this.value === currentDisplay) {
          //d3.select(this).attr("selected", "selected")
         displaySelect.node().value= this.value;
        }
      })
    
    var timecontrols = d3.select("#timecontrols")
      .selectAll("button");

    timecontrols.datum(function() { return this.dataset; })
    timecontrols.filter(function(d) {
      return that.model.get(d.name);
    })
    .classed("active", true);

    timecontrols.on("click", function(d) {
      var tf = !that.model.get(d.name);
      d3.select(this).classed("active", tf);
      that.model.set(d.name, tf);
    });


    // Editor controls config section

    var editorcontrols = d3.select(this.el)
      .select("#logerrors")
      .on("click", function(d) {
        var dis = d3.select(this);
        if($(this).attr("data-name") === "log-errors") {
          //if (tributary.hint === true && tributary.trace === true) {
          if( dis.classed("active") ) {
            console.log("Error logging disabled");
            tributary.hint = false;
            tributary.trace = false;
            tributary.events.trigger("execute");
            dis.classed("active", false)
          }
          else {
            console.log("Error logging initiated");
            tributary.hint = true;
            tributary.trace = true;
            tributary.events.trigger("execute");
            dis.classed("active", true)
          }
        }
      })


    // Require / External files config section
    var require = d3.select(this.el)
      .select(".requirecontrols");

    var plus = require.selectAll(".plus");
    var add= require.selectAll(".tb_add");


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

