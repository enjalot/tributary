

//GUI for loading files
tributary.FilesView = Backbone.View.extend({
  initialize: function() {
    
  },
  render: function() {
    var that = this;
    var fvs = d3.select(this.el).selectAll("div")
      .data(this.model.contexts);

    var fv = fvs.enter()
      .append("div")
        .classed("fv", true);
    fv.on("click", function(d) {
      //console.log(d.model.get("filename"));
      //trigger hide event on the config, which will hide all the editors for us
      that.model.trigger("hide");
      //trigger show event on the model, so only the editor for this model will show up
      d.model.trigger("show");

      tributary.events.trigger("show", "edit");
    });
    fv.append("span")
      .text(function(d) {
        return d.model.get("filename");
      });


    //add the + button
    var plus = d3.select(this.el).append("div")
      .classed("fv", true);

    plus.append("span")
      .text("+");

    var input = plus.append("input")
      .attr({
        type: "text"
      })
    .style({
      visibility: "hidden"
    });


    plus.on("click", function() {
      input
        .style("visibility","visible");
      input.node().focus();
      input.on("keypress", function() {
        //they hit enter
        if(d3.event.charCode === 13) {
          //create a new file with the given name
          var context = tributary.make_context({ filename: input.node().value, config: that.model });
          if(context) {
            that.model.contexts.push(context);
            context.render();
            context.execute();
            tributary.make_editor({model: context.model});
            
            //rerender the files view to show new file
            that.$el.empty();
            that.render();
          } else {
            input.classed("input_error", true);
          }
        }
      });

    });
    
    
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
    

  },
});

tributary.FileView = Backbone.View.extend({
  render: function() {
  }
});
