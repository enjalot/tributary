
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

    //we render the codemirror instance into the el
    this.cm = CodeMirror(this.el, {
        //value: "function myScript(){return 100;}\n",
        mode: that.model.get("mode"),
        theme: "lesser-dark",
        lineNumbers: true,
        onChange: function() {
          var code = that.cm.getValue();
          //TODO: local storage?
          that.model.set("code", code);

        }
    });

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
