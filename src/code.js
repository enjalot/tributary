
//Base Model for all code and data files (js/cs, json, csv, html, css)
//serves mostly as the event system for other components to interact with
tributary.CodeModel = Backbone.Model.extend({

  defaults: {
    code: "",
    filename: "inlet.js",
    name: "inlet",
    type: "js", 
    mode: "javascript",
  
    //this configuration is mostly for the editor
    config: {
      coffee: true,
      vim: false,
      emacs: false,
      hide: false
    }

  },

  //we have default behavior for handling some events
  //optional error output is the main one the model is responsible for
  initialize: function() {
    this.binder();
  },
  binder: function() {
    this.on("error", this.handle_error);
  },
  handle_error: function(e) {
    if(tributary.trace) {
      console.trace();
      console.log(e);
      //console.error(e);
    }
  },

  handle_coffee: function() {
    //This checks if coffeescript is being used
    //and returns compiled javascript
    var js = this.get("code");
    if(this.get("config").coffee && this.get("type") == "cs") {
      //compile the coffee
      js = CoffeeScript.compile(js, {"bare":true});
    }
    return js;
  },
 

  //main use case of local storage is recovery after a crash
  //uniqueness comes from filename and optional user defined key
  local_storage: function(key) {
    //optionally add a key for more uniquely storing the code
    if(!key) { key = ""; }
    var ep = this.get("filename") + "/code/" + key;
    return localStorage[ep];
  },
  set_local_storage: function(code, key) {
    var ep = this.get("filename") + "/code/" + key;
    localStorage[ep] = code;
  },

});


tributary.CodeModels = Backbone.Collection.extend({
  model: tributary.CodeModel
});
