
//The editor view renders the CodeMirror editor and sets up the logic for interaction
//with the code model 
tributary.EditorView = Backbone.View.extend({
  initialize: function() {

    this.config = this.model.get("config");
    //TODO: drag and drop
  },
  render: function() {
    var that = this;

    console.log("editor el", this.el);

    //we render the codemirror instance into the el
    this.cm = CodeMirror(this.el, {
        //value: "function myScript(){return 100;}\n",
        mode:  "javascript",
        theme: "lesser-dark",
        lineNumbers: true,
        onChange: function() {
            var code = cm.getValue();
            if(that.config.coffee) {
              code = CoffeeScript.compile(code, {"bare":true});
            }
            that.model.trigger("code", code);
        }
    });


  }
});
