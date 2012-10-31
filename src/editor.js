
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


    var errlines = -1;
    this.model.on("jshint", function(errors) {
      //turn off highlighting of any error lines
      for(var i = that.cm.lineCount(); i--;) {
        that.cm.setLineClass(i, null, null);
        that.cm.setMarker(i, "%N%", "");
      }
      var err;
      for(i = errors.length; i--; ) {
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
    });

    this.model.on("nojshint", function() {
      //turn off highlighting of any error lines
      for(var i = that.cm.lineCount(); i--;) {
        that.cm.setLineClass(i, null, null);
      }
    })

  }
});
