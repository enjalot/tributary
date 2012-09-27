
//The editor model.
//contains configuration for the editor.
//An editor will be responsible for one file.
//The type of editor will determine some of the options it displays
tributary.Editor = Backbone.Model.extend({
  defaults: {        
    filename: "inlet.js",
    mode: "javascript", //matches CodeMirror modes
    coffee: false,
    vim: false,
    emacs: false,
    hide: false
  },
  initialize: function() {
  },
  
});

tributary.Editors = Backbone.Collection.extend({
  model: tributary.Editor
});


//The editor view renders the CodeMirror editor and sets up the logic for interaction
//with the code model as well as the editor's config
tributary.EditorView = Backbone.View.extend({
  initialize: function() {
    //we will keep track of the code model in addition to our editor model
    this.code_model = this.options.code_model;

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
            that.code_model.trigger("code", code);
        }
    });


  }
});
