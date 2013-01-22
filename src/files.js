//GUI for loading files
tributary.FilesView = Backbone.View.extend({
  initialize: function() {

  },
  render: function() {
    var that = this;

    var template = Handlebars.templates.files;

    //render all the file tabs
    //var contexts = _.map(this.model.contexts, function(ctx) { return ctx.model.toJSON(); });
    var contexts = _.map(tributary.__config__.contexts, function(ctx) { return ctx.model.toJSON(); });
    //sort by filename
    contexts = contexts.sort(function(a,b) { if(a.filename < b.filename) return -1; return 1; });
    //inlet.js comes first TODO: mainfile comes first (TributaryContext)
    var inlet = _.find(contexts, function(d) { return d.filename === "inlet.js" || d.filename === "inlet.coffee" });
    if(inlet) {
      contexts.splice(contexts.indexOf(inlet), 1);
      contexts.unshift(inlet);
    }

    $(this.el).html(template({
      contexts: contexts
    }));

    var filelist = d3.select("#file-list")
      .selectAll("li.file")

    //setup the event handlers for the file tabs
    filelist.on("click", function(d) {
      var filename = this.dataset.filename;
      var ctx = _.find(tributary.__config__.contexts, function(d) { return d.model.get("filename") === filename; });
      that.model.trigger("hide");
      ctx.model.trigger("show");
    });

    //delete
    filelist.select(".delete-file")
      .style("z-index", 1000)
      .on("click", function() {
        var dataset = this.parentNode.dataset
        var filename = dataset.filename;
        var name = dataset.filename.split(".")[0];

        //delete the model
        //delete that.model;
        //delete the file from the config
        tributary.__config__.unset(filename);
        //delete the context
        var context = _.find(tributary.__config__.contexts, function(d) {
          return d.model.get("filename") === filename;
        })
        //delete the editor
        context.model.trigger("delete");

        var ind = tributary.__config__.contexts.indexOf(context);
        tributary.__config__.contexts.splice(ind,1);
        delete context;

        if(!tributary.__config__.todelete) {
          tributary.__config__.todelete = [];
        }
        tributary.__config__.todelete.push(filename);


        //remove the tab
        d3.select(that.el).selectAll("li.file")
          .each(function() {
            if(this.dataset.filename === filename) {
              $(this).remove();
            }
          })

        //show the first context available
        var othertab = tributary.__config__.contexts[0].model;
        othertab.trigger("show");
        d3.event.stopPropagation();
      })


    //the new file button
    var plus = d3.select(this.el).select(".add-file")
      .on("click", function() {
        var input = d3.select(this).select("input")
          .style("display","inline-block");

        input.node().focus();
        input.on("keypress", function() {
          //they hit enter
          if(d3.event.charCode === 13) {
            //create a new file with the given name
            var context = tributary.make_context({ filename: input.node().value, config: tributary.__config__ });
            if(context) {
              tributary.__config__.contexts.push(context);
              context.render();
              context.execute();
              var editor = tributary.make_editor({model: context.model});

              //rerender the files view to show new file
              that.$el.empty();
              that.render();
              //that.model.trigger("hide");
              tributary.__config__.contexts.forEach(function(c) { c.model.trigger("hide") });
              context.model.trigger("show");
              editor.cm.focus();

              /*
              fvs.attr("class", function(d,i){
                var filetype = this.dataset.filename.split(".")[1]
                return "fv type-"+filetype;
              })
              */


            } else {
              input.classed("error", true);
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
