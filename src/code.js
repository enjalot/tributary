
//Base Model for all code and data files (js/cs, json, csv, html, css)
//serves mostly as the event system for other components to interact with
tributary.Code = Backbone.Model.extend({

  defaults: {
    code: "",
    coffee: false,
    filename: "inlet.js",
  },

  //we have default behavior for handling some events
  //optional error output is the main one the model is responsible for
  initialize: function() {
    this.binder();
  },
  binder: function() {
    this.on("error", this.handle_error);
  },

  //
  handle_error: function(e) {
    if(tributary.trace) {
      console.trace();
      //console.log(e);
      console.error(e);
    }
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
