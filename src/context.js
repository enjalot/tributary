
//The Context is the essential part of tributary, it is what makes assumptions
//about the code and provides the context for the code to execute.

//The primary purpose of the context will be to supply the event handler for the 
//execute event from the code model
tributary.Context = Backbone.View.extend({

  initialize: function() {
  },

  render: function() {
  },

});


tributary.JSONContext = Backbone.View.extend({

  initialize: function() {
    this.model.on("code", this.execute);
  },

  execute: function() {
    try {
      var json = JSON.parse(this.get("code"));
      tributary[this.get("name")] = json;
    } catch (e) {
      this.trigger("error", e);
      return false;
    }
    this.trigger("noerror");

    return true;

  },

  render: function() {
    //JSON context doesn't do anything on rendering
  },

});



