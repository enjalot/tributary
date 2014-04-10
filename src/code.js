
//Base Model for all code and data files (js/cs, json, csv, html, css)
//serves mostly as the event system for other components to interact with
tributary.CodeModel = Backbone.Model.extend({

  defaults: {
    code: "",
    filename: "inlet.js",
    name: "inlet",
    type: "js",
    mode: "javascript",
  },

  //we have default behavior for handling some events
  //optional error output is the main one the model is responsible for
  initialize: function() {
    this.binder();
  },
  binder: function() {
    this.on("error", this.handleError);
    this.on("noerror", this.handleNoError);
  },
  handleError: function(err) {
    tributary.__error__ = true;
    if(tributary.trace) {
      //console.trace();
      //console.log(err.stack);
      //console.error(err);
      var trace = err.stack;
      var match = trace.match(/eval at \<anonymous\>.*\<anonymous\>:([0-9]+):([0-9]+)/)
      if(match) {
        console.log("Error in " + this.get("filename") + ": line: " + (match[1]-1) + " column: " + (match[2]-1) + "\n" + err.toString());
      } else {
        console.error(err);
      }

    }
  },
  handleNoError: function() {
    tributary.__events__.trigger("noerror");
    tributary.__error__ = false;
  },

  /*
  handleCode: function() {
    //This checks if coffeescript is being used
    //and returns compiled javascript
    var code = this.get("code");
    if(this.get("mode") === "coffeescript") {
      //compile the coffee
      js = CoffeeScript.compile(code, {"bare":true});
      return js;
    } else if (this.get("type") === "pde") {
      js = Processing.compile(code).sourceCode;
      return js;
    }
    return code;
  },
  */
  //We allow parsing of code before execution
  handleParser: function(js) {
    try {
      var transformed = tributary.__parser__(js, this.get("filename"));
    } catch(e) {
      if(tributary.trace)
        console.log("PARSE", e.stack);
    }
    try {
      js = escodegen.generate(transformed);
    } catch(e) {
      if(tributary.trace)
        console.log("GENERATE", e.stack)
    }
    if(tributary.trace) {
      // TODO expose this some other way, pollutes reading out runtime errors
      //console.log("JS", js)
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
