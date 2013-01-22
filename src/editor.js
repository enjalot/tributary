tributary.make_editor = function(options) {
  //Creates a editor from a model and optional editor container
  //{
  //  model: REQUIRED
  //  container: optional, default: editorParent.append("div") with model.cid as id
  //  parent: optional, the parent element to append our container to, default: tributary.edit
  //}

  var editorParent = options.parent || tributary.edit;
  var model = options.model;

  if(options.container) {
    container = options.container;
  } else {
    container = editorParent.append("div")
      .attr("id", model.cid);
  }

  var editor;
  editor = new tributary.Editor({
    el: container.node(),
    model: model
  });
  editor.render();
  return editor;
}




//The editor view renders the CodeMirror editor and sets up the logic for interaction
//with the code model
tributary.Editor = Backbone.View.extend({
  initialize: function() {
    //TODO: drag and drop
    this.model.on("show", function() {
      d3.select(this.el).style("display", "");
    }, this);
    this.model.on("hide", function() {
      d3.select(this.el).style("display", "none");
    }, this);

    this.model.on("delete", function() {
      this.$el.remove();
    }, this)

  },
  getConfig: function() {
    var fileconfigs = tributary.__config__.get("fileconfigs");
    var fileconfig = fileconfigs[this.model.get("filename")]
    if(!fileconfig) return this.defaultConfig();
    return fileconfig;
  },
  setConfig: function(key,value) {
    var fileconfigs = tributary.__config__.get("fileconfigs");
    var fileconfig = fileconfigs[this.model.get("filename")]
    fileconfig[key] = value;
    var fileconfigs = tributary.__config__.set("fileconfigs", fileconfigs);
  },
  defaultConfig: function() {
    var fileconfigs = tributary.__config__.get("fileconfigs");
    var fileconfig = {
      default: true,
      vim: false,
      emacs: false,
      fontSize: 12
    };
    fileconfigs[this.model.get("filename")] = fileconfig;
    var fileconfigs = tributary.__config__.set("fileconfigs", fileconfigs);
    return fileconfig;
  },
  render: function() {
    var that = this;

    var dis = d3.select(this.el)
      .classed("editor", true)

    //create the toolbar
    var template = Handlebars.templates.editor;
    var html = template(this.getConfig());
    this.$el.html(html);


    filetype = that.model.get("filename").split(".")[1];

    if(filetype == "js") {
      var editor_theme = "lesser-dark";
    }
    else if(filetype == "svg") {
      var editor_theme = "vibrant-ink"
    }
    else if(filetype == "html") {
      var editor_theme = "ambiance"
    }
    else if(filetype == "coffee"){
      var editor_theme = "elegant"
    }
    else if(filetype == "css"){
      var editor_theme = "elegant"
    }
    else {
      var editor_theme = "lesser-dark"
    }

    var codemirror_options = {
        //value: "function myScript(){return 100;}\n",
        mode: that.model.get("mode"),
        theme: editor_theme,
        lineNumbers: true,
    }
    if(that.model.get("mode") === "json") {
      codemirror_options.mode = "javascript";
      codemirror_options.json = true;
    }
    //we render the codemirror instance into the el
    this.cm = CodeMirror(this.el, codemirror_options);

    this.cm.on("change", function() {
      var code = that.cm.getValue();
      //TODO: local storage?
      that.model.set("code", code);
    })

    this.cm.setValue(this.model.get("code"));
    this.inlet = Inlet(this.cm);

    this.model.on("error", function() {
      d3.select(that.el).select(".CodeMirror-gutter")
        .classed("error", true);
    });
    this.model.on("noerror", function() {
      d3.select(that.el).select(".CodeMirror-gutter")
        .classed("error", false);
    });



    /*
      //TODO: fix line highlighting with codemirror 3.0 api
    var olderrors = [];
    this.model.on("jshint", function(errors) {
      //turn off highlighting of any error lines
      //d3.select(that.el).selectAll(".lineerror").classed("lineerror", false);
      //d3.select(that.el).selectAll(".linenumbererror").classed("linenumbererror", false);
      //d3.selectAll("pre.linenumbererror").classed("linenumbererror", false);
      var err;
      //TODO: this actually misses sometimes, when you hit enter all the lines
      //will be different from last time
      try {

        for(var i = olderrors.length; i--;) {
          err = olderrors[i];
          if(err) {
            that.cm.setLineClass(err.line-1, null, null);
            that.cm.setMarker(err.line-1, "%N%", null);
          }
        }

      //console.log(olderrors, errors)
              var oldlines = _.pluck(olderrors, "line");
        var lines = _.pluck(errors, "line");
        var diff = _.difference(oldlines, lines);
        //console.log("diff", diff);
        var line;
        for(i = diff.length; i--;) {
          line = diff[i];
          that.cm.setLineClass(line-1, null, null);
          that.cm.setMarker(line-1, "%N%", null);
        }

        for(var i = errors.length; i--; ) {
          err = errors[i];
          if(err) {
            //go through the errors and highlight the lines
            that.cm.setLineClass(err.line-1, null, "lineerror");
            that.cm.setMarker(err.line-1, "%N%", "linenumbererror");
            if(tributary.hint) {
              console.log("Error on line: " + err.line + " (" + that.model.get("filename") + ") reason: " + err.reason)
            }
          }
        }
      } catch (e) {
        //TODO: fix this shit?
      }

      olderrors = _.clone(errors);

    });

    this.model.on("nojshint", function() {
      if(olderrors.length) {
        //turn off highlighting of any error lines
        for(var i = that.cm.lineCount(); i--;) {
          that.cm.setLineClass(i, null, null);
          that.cm.setMarker(i, "%N%", null);
        }
        olderrors = [];
      }
    })

    */


    //Setup toolbar functionality
    var toolbar = dis.select(".toolbar");
    var settings = dis.select(".settings")
      .on("click", function() {
        toolbar.classed("hidden", !toolbar.classed("hidden"))

        settings.classed("active-settings", !toolbar.classed("hidden"))
      })


    toolbar.selectAll(".radio")
      .on("change", function() {
        that.setConfig("default", false)
        that.setConfig("vim", false)
        that.setConfig("emacs", false)
        that.setConfig(this.value, true)
        that.cm.setOption("keyMap", this.value)
      })


    toolbar.select(".plusFontSize")
      .on("click", function() {
        var fileconfig = that.getConfig();
        var fontSize = fileconfig.fontSize + 1;
        that.setConfig("fontSize", fontSize);
        var wrap = that.cm.getWrapperElement();
        d3.select(wrap).select(".CodeMirror-scroll")
          .style({
            "font-size": fontSize + "px",
            "line-height": fontSize + "px"
          })
		    that.cm.refresh();
      })

    toolbar.select(".minusFontSize")
      .on("click", function() {
        var fileconfig = that.getConfig();
        var fontSize = fileconfig.fontSize - 1;
        that.setConfig("fontSize", fontSize);
        var wrap = that.cm.getWrapperElement();
        d3.select(wrap).select(".CodeMirror-scroll")
          .style({
            "font-size": fontSize + "px",
            "line-height": fontSize + "px"
          })
		    that.cm.refresh();
      })


    var fileconfig = that.getConfig();
    var fontSize = fileconfig.fontSize;
    var wrap = that.cm.getWrapperElement();
    d3.select(wrap).select(".CodeMirror-scroll")
      .style({
        "font-size": fontSize + "px",
        "line-height": fontSize + "px"
      })
    that.cm.refresh();


    /*
    toolbar.select("#delete-file")
      .on("click", function() {
        var filename = that.model.get("filename");
        var name = that.model.get("name");
        //delete the model
        delete that.model;
        //delete the file from the config
        tributary.__config__.unset(filename);
        //delete the context
        var context = _.find(tributary.__config__.contexts, function(d) {
          return d.model.get("filename") === filename;
        })
        var ind = tributary.__config__.contexts.indexOf(context);
        tributary.__config__.contexts.splice(ind,1);
        delete context;

        if(!tributary.__config__.todelete) {
          tributary.__config__.todelete = [];
        }
        tributary.__config__.todelete.push(filename);

        //delete the editor
        that.$el.remove();
        delete that;

        //remove the tab
        d3.select(".tb_files").selectAll("div.fv")
          .each(function() {
            if(this.dataset.filename === filename) {
              $(this).remove();
            }
          })

        //show the first context available
        var othertab = tributary.__config__.contexts[0].model;
        othertab.trigger("show");
      })
      */


  }
});
