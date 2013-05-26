//GUI for loading files
Tributary.FilesView = Backbone.View.extend({
  initialize: function(options) {
  },
  render: function() {
    var that = this;

    var template = Handlebars.templates.files;
    var config = this.model;
    
    //render all the file tabs
    //var contexts = _.map(this.model.contexts, function(ctx) { return ctx.model.toJSON(); });
    var contexts = _.map(config.contexts, function(ctx) { return ctx.model.toJSON(); });
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
      var ctx = _.find(config.contexts, function(d) { return d.model.get("filename") === filename; });
      that.model.trigger("hide");
      ctx.model.trigger("show");
      ctx.editor.cm.refresh();
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
        config.unset(filename);
        //delete the context
        var context = _.find(config.contexts, function(d) {
          return d.model.get("filename") === filename;
        })
        //delete the editor
        context.model.trigger("delete");

        var ind = config.contexts.indexOf(context);
        config.contexts.splice(ind,1);
        delete context;

        if(!config.todelete) {
          config.todelete = [];
        }
        config.todelete.push(filename);


        //remove the tab
        d3.select(that.el).selectAll("li.file")
          .each(function() {
            if(this.dataset.filename === filename) {
              $(this).remove();
            }
          })

        //show the first context available
        var othertab = config.contexts[0].model;
        othertab.trigger("show");
        d3.event.stopPropagation();
      })

    console.log("supppp");

    //the new file button
    var plus = d3.select(this.el).select(".add-file")
      .on("click", function() {
        var input = d3.select(this).select("input")
          .style("display","inline-block");

        input.node().focus();
        //input.on("keypress", keyPress)
        input.on("keyup", keyPress)
        function keyPress() {
          //they hit enter
          if(d3.event.keyCode === 13) {
            if(input.node().value === "") {
              return input.style("display","none");
            }
            //create a new file with the given name
            var context = Tributary.makeContext({ filename: input.node().value, config: config });
            if(context) {
              config.contexts.push(context);
              context.render();
              context.execute();
              var editor = Tributary.makeEditor({model: context.model});
              context.editor = editor;

              //rerender the files view to show new file
              that.$el.empty();
              that.render();
              //that.model.trigger("hide");
              config.contexts.forEach(function(c) { c.model.trigger("hide") });
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
        }
    });

  },
});

Tributary.FileView = Backbone.View.extend({
  render: function() {
  }
});
