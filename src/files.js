

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

  },
});

tributary.FileView = Backbone.View.extend({
  render: function() {
  }
});
