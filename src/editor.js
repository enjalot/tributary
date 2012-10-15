
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

  }
});
