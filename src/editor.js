
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

    this.config = this.model.get("config");
    //TODO: drag and drop

    this.model.on("show", function() {
      d3.select(this.el).style("display", "");
    }, this);
    this.model.on("hide", function() {
      d3.select(this.el).style("display", "none");
    }, this);

  },
  render: function() {
    var that = this;

    d3.select(this.el)
      .classed("editor", true)


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
        onChange: function() {
          var code = that.cm.getValue();
          //TODO: local storage?
          that.model.set("code", code);
        }
    }
    if(that.model.get("mode") === "json") {
      codemirror_options.mode = "javascript";
      codemirror_options.json = true;
    }
    //we render the codemirror instance into the el
    this.cm = CodeMirror(this.el, codemirror_options);

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


    var olderrors = [];
    this.model.on("jshint", function(errors) {
      //turn off highlighting of any error lines
      //d3.select(that.el).selectAll(".lineerror").classed("lineerror", false);
      //d3.select(that.el).selectAll(".linenumbererror").classed("linenumbererror", false);
      //d3.selectAll("pre.linenumbererror").classed("linenumbererror", false);
      var err;
      /*
      for(var i = olderrors.length; i--;) {
        err = olderrors[i];
        console.log("indof", err)
        that.cm.setLineClass(err.line-1, null, null);
        //that.cm.setMarker(err.line-1, "%N%", null);
      }
      */

      //console.log(olderrors, errors)
      //TODO: this actually misses sometimes, when you hit enter all the lines
      //will be different from last time
      try {
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
      //turn off highlighting of any error lines
      for(var i = that.cm.lineCount(); i--;) {
        that.cm.setLineClass(i, null, null);
      }
    })

  }
});
