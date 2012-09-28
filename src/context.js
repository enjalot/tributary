
//The Context is the essential part of tributary, it is what makes assumptions
//about the code and provides the context for the code to execute.

//The primary purpose of the context will be to supply the event handler for the 
//execute event from the code model
tributary.Context = Backbone.View.extend({

  initialize: function() {
    this.model.on("change:code", this.execute, this);
  },

  execute: function() {   
    var js = this.model.handle_coffee();
    try {
        tributary.initialize = new Function("g", js);
    } catch (e) {
        this.trigger("error", e);
        return false;
    }
    
    try {
        //for the datGUI stuff
        //TODO: move this out of here to it's own function
        window.trib = {};               //reset global trib object
        window.trib_options = {};       //reset global trib_options object
        trib = window.trib;
        trib_options = window.trib_options;

        //empty out our svg element
        $(this.el).children("svg").empty();

        //execute the code
        tributary.initialize(this.svg);

    } catch (er) {
        this.model.trigger("error", er);
        return false;
    }
    this.model.trigger("noerror");

    return true;
},

  render: function() {
    //Use mustache or other templates here? naaah...
    this.svg = d3.select(this.el).append("svg")
      .attr({
        "xmlns":"http://www.w3.org/2000/svg",
        //this usually requires xmlns:xlink but chrome wont let me add that
        "xlink":"http://www.w3.org/1999/xlink",
        class:"tributary_svg"       
      });
  },

});


tributary.JSONContext = Backbone.View.extend({

  initialize: function() {
    this.model.on("code", this.execute, this);
  },

  execute: function() {
    try {
      var json = JSON.parse(this.model.get("code"));
      tributary[this.model.get("name")] = json;
    } catch (e) {
      this.model.trigger("error", e);
      return false;
    }
    this.model.trigger("noerror");

    return true;

  },

  render: function() {
    //JSON context doesn't do anything on rendering
  },

});



