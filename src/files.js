

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
  },
});

tributary.FileView = Backbone.View.extend({
  render: function() {
  }
});
