

//GUI for loading files
tributary.ControlsView = Backbone.View.extend({
  initialize: function() {
    this.model.on("change:play", this.play_button, this);
    
  },
  render: function() {
    var del = d3.select(this.el);

    del.append("div")
      .attr("id", "time_controls");
    del.append("div")
      .attr("id", "user_controls");
    del.append("div")
      .attr("id", "time_options");

    this.play_button();
    this.time_slider();

  },

  play_button: function() {
    //console.log("play!", this.model.get("play"));
    //add/remove play button
    var tc = d3.select(this.el).select("#time_controls");
    if(this.model.get("play")) {
      //create the button
      var pb = tc.append("button")
        .classed("play", true)
        .classed("button_on", true) 
        .text("Play");

      pb.on("click", function(event) {
        if(!tributary.pause){
          pb.classed("playing", false);
          pb.text("Play");
        } else if(tributary.pause){
          pb.classed("playing", true);
          pb.text("Pause");
        }
        
        if(tributary.t < 1 || !tributary.loops) {
          tributary.pause = !tributary.pause;
          
          if(!tributary.pause) {
            //unpausing, so we setup our timer to run
            tributary.timer.then = new Date();
            tributary.timer.duration = (1 - tributary.t) * tributary.duration;
            tributary.timer.ctime = tributary.t;
          }
        }
      });
    } else {
      //destroy the button
      tc.select("button.play").remove();
    }
  },

  time_slider: function() {
    var tc = d3.select(this.el).select("#time_controls");
    if(this.model.get("loops")) {

      var ts = tc.append("input")
        .attr({
          type: "range",
          min: 0,
          max: 1,
          step: 0.01,
          value: 0,
          name: "time"
        })
      .classed("time_slider", true);

      //idk why jquery selections for on("change") works but d3 doesnt...
      $(ts.node()).on('change', function() {
        tributary.t = parseFloat(this.value);//$('#slider').attr('value');
        if(tributary.pause){
          //only want to run code if we aren't already playing
          tributary.execute();    
        }
      });
      this.model.on("tick", function(t) {
        $(ts.node()).attr("value", tributary.t);
      });


      var bv = tc.append("button")
        .classed("bv", true)
        .classed("button_on", true) 
        .text("BV");

      bv.on("click", function() {
        tributary.bv = !tributary.bv;
        tributary.events.trigger("execute");
      });


    } else {
      tc.select("input.time_slider").remove();
      tc.select("button.bv").remove();
    }

  },
});
