

//GUI for loading files
tributary.FilesView = Backbone.View.extend({
  initialize: function() {
    
  },
  render: function() {
    var that = this;

    var template = Handlebars.templates.files;

    //render all the file tabs
    var contexts = _.map(this.model.contexts, function(ctx) { return ctx.model.toJSON(); });
    //sort by filename
    contexts = contexts.sort(function(a,b) { if(a.filename < b.filename) return -1; return 1; });
    //inlet.js comes first
    var inlet = _.find(contexts, function(d) { return d.filename === "inlet.js" });
    contexts.splice(contexts.indexOf(inlet), 1);
    contexts.unshift(inlet);
    
    var context ={
      contexts: contexts
    };
    $(this.el).html(template(context));


    //setup the event handlers for the file tabs
    var fvs = d3.select(this.el).selectAll("div.fv")
    fvs.on("click", function(d) {
      var filename = this.dataset.filename;
      var ctx = _.find(that.model.contexts, function(d) { return d.model.get("filename") === filename; });
      that.model.trigger("hide");
      ctx.model.trigger("show");
      tributary.events.trigger("show", "edit");
    });

    //the new file button
    var plus = d3.select(this.el).selectAll("div.plus")
      .on("click", function() {
        var input = d3.select(this).select("input")
          .style("display","inline-block");
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
              var editor = tributary.make_editor({model: context.model});
              
              //rerender the files view to show new file
              that.$el.empty();
              that.render();
              that.model.trigger("hide");
              context.model.trigger("show");
              editor.cm.focus();


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
