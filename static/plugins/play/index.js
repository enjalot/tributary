
//You must register your plugin with the global tributary object
//id: the id should match what's in the plugin.json
//function: the plugin function which has access to the tributary instance and
//the plugin object
Tributary.plugin("play", tributaryPlayPlugin);

//tributary is the main object available in inlets
//plugin has some gauranteed elements:
//{
//  elId: a UUID that will also be the element id of a div
//}
//You are expected to return a plugin object with the following methods exposed:
//{
//  activate() { //initializes the plugin },
//  deactivate() { //cleans up after the plugin (removes itself) }
//}
function tributaryPlayPlugin(tributary, plugin) {
  var el;
  var config = tributary.__config__;

  plugin.activate = function() {
    el = document.getElementById(plugin.elId);
    
    init();
    playButton();
    timeSlider();
    restartButton();
    
    config.on("change:play", playButton, this);
    config.on("change:loop", timeSlider, this);
    config.on("change:restart", restartButton, this);
    config.on("pause", onPlayPause, this);
    
    //Setup the ui for choosing the controls in the config div
    var configDiv = d3.select("#config-content");
    var timecontrolsDiv = configDiv.node().appendChild(d3.select(el).select(".timecontrols").node());
    var timecontrols = d3.select(timecontrolsDiv)
      .selectAll("button");

      timecontrols.datum(function() { return this.dataset; })
      timecontrols.filter(function(d) {
        return config.get(d.name);
      })
      .classed("active", true);

      timecontrols.on("click", function(d) {
        var tf = !config.get(d.name);
        d3.select(this).classed("active", tf);
        config.set(d.name, tf);
      });
  }

  plugin.deactivate = function() {
    el = document.getElementById(plugin.elId);
    el.innerHTML = "";
    
    tributary.pause = true;
    var configDiv = d3.select("#config-content");
    var timecontrolsDiv = configDiv.select(".timecontrols").remove();
    
    //remove all the stuff we added to tributary
    destroy();
  }


  function onPlayPause() {
    var tc = d3.select(el).select(".time_controls");
    var pb = tc.select("button.play");
    if(!tributary.pause){
      pb.classed("playing", false);
      pb.text("Play");
    } else if(tributary.pause){
      pb.classed("playing", true);
      pb.text("Pause");
    }
    
    if(tributary.t < 1 || !tributary.loop) {
      tributary.pause = !tributary.pause;
      
      if(!tributary.pause) {
        //unpausing, so we setup our timer to run
        tributary.timer.then = new Date();
        tributary.timer.duration = (1 - tributary.t) * tributary.duration;
        tributary.timer.ctime = tributary.t;
      }
    }
  }
  function playButton() {
    //add/remove play button
    var tc = d3.select(el).select(".time_controls");
    if(config.get("play")) {
      //create the button
      var pb = tc.select("button.play")
      pb.style("display", "")

      pb.on("click", onPlayPause);
      onPlayPause();
    } else {
      //destroy the button
      tc.select("button.play").style("display", "none");
    }
  }

  function timeSlider() {
    tributary.loop = config.get("loop");
    var tc = d3.select(el).select(".time_controls");
    if(tributary.loop) {
      var ts = tc.select("input.time_slider");
      ts.style("display", "")
      
      //idk why jquery selections for on("change") works but d3 doesnt...
      ts.on('change', function() {
        tributary.t = parseFloat(this.value);//$('#slider').attr('value');
        if(tributary.pause){
          //only want to run code if we aren't already playing
          tributary.execute();    
        }
      });
      config.on("tick", function(t) {
        ts.node().setAttribute("value", tributary.t);
        ts.node().value = tributary.t;
      });

      //TODO: generalize BV button to other displays
      if(config.get("display") === "svg") {
        var bv = tc.select("button.bv")
        bv.style("display", "");

        bv.on("click", function() {
          tributary.bv = !tributary.bv;
          tributary.events.trigger("execute");
        });
      }

    } else {
      tributary.bv = false;
      tc.select("input.time_slider").style("display", "none");
      tc.select("button.bv").style("display", "none");
    }

  }

  //RESTART BUTTON
  //this restart button does something special. It calls the user defined init function, but it also
  //makes it so that normal execution does not call the init function
  function onRestart() {
    tributary.clear();
    try {
      if(tributary.initialize) {
        tributary.initialize(tributary.g, tributary);
      }
      if(tributary.init) {
        tributary.init(tributary.g);
      }
      tributary.execute();
    } catch(e) {
      tributary.events.trigger("error", e);
    }
    tributary.events.trigger("restart");
  }
  function restartButton() {
    var that = this;
    //console.log("play!", config.get("play"));
    //add/remove play button
    var tc = d3.select(el).select(".time_controls");
    if(config.get("restart")) {
      tributary.autoinit = false;
      //create the button
      var rb = tc.select("button.restart")
        .classed("button_on", true) 
      rb.style("display", "")

      rb.on("click", onRestart);
      onRestart();
    } else {
      tributary.autoinit = true;
      //destroy the button
      tc.select("button.restart").style("display", "none");
    }
  }


  function init() {
    //time controls;
    tributary.loop = config.get("loop");

    //default parameters for this context
    tributary.pause = config.get("pause"); //pause is used to pause and unpause
    tributary.loop_type = config.get("loop_type"); //["off", "period", "pingpong"]
    tributary.bv = config.get("bv");
    tributary.nclones = config.get("nclones");
    tributary.clone_opacity = config.get("clone_opacity");
    tributary.duration = config.get("duration");
    tributary.ease = d3.ease(config.get("ease"));
    tributary.t = 0;
    tributary.dt = config.get("dt");
    tributary.reverse = false;
    
    //we need to save state of timer so when we pause/unpause or manually change slider
    //we can finish a transition
    tributary.timer = {
      then: new Date(),
      duration: tributary.duration,
      ctime: tributary.t
    };

    tributary.execute = function() {
      if(tributary.run !== undefined) {
        var t = tributary.t;
        if(tributary.loop) {
          t = tributary.ease(tributary.t); 
        }
        tributary.run(tributary.g, t, 0);
      }
    }

    d3.timer(timerFunction);
    function timerFunction() {
      tributary.render();
      //if paused lets not execute
      if(tributary.pause) { return false; }
      if(tributary.__error__) { return false; }

      var now = new Date();
      var dtime = now - tributary.timer.then;
      var dt;
            
      //TODO: implement play button, should reset the timer
      if(tributary.loop) {
        if (tributary.reverse) {
          dt = tributary.timer.ctime * dtime / tributary.timer.duration * -1;
        } else {
          dt = (1 - tributary.timer.ctime) * dtime / tributary.timer.duration;
        }
        tributary.t = tributary.timer.ctime + dt;

        //once we reach 1, lets pause and stay there
        if(tributary.t >= 1 || tributary.t <= 0 || tributary.t === "NaN")
        {
          if(tributary.loop_type === "period") {
            tributary.t = 0;
            tributary.timer.then = new Date();
            tributary.timer.duration = tributary.duration;
            tributary.timer.ctime = tributary.t;
            tributary.reverse = false;
            //tributary.pause = false;
          } else if (tributary.loop_type === "pingpong") {
            //this sets tributary.t to 0 when we get to 0 and 1 when we get to 1 (because of the direction we were going)
            tributary.t = !tributary.reverse; //*1 casts the boolean to an int;
            tributary.timer.then = new Date();
            tributary.timer.duration = tributary.duration;
            tributary.timer.ctime = tributary.t;
            tributary.reverse = !tributary.reverse;
          }
          else {
            if (tributary.t !== 0)
            {
                tributary.t = 1;
                tributary.pause = true;
                tributary.__config__.trigger("pause");
            }
          }
        } 
        //TODO: fix, look up 10 lines to pingpong
        //not sure why we get true and false for 1 and 0 when range hits the end
        if(tributary.t === true) { tributary.t = 1; }
        if(tributary.t === false) { tributary.t = 0; }
      } else {
        tributary.t += tributary.dt;
      }
      
      try {
        tributary.execute();
        tributary.__config__.trigger("noerror");
      } catch (err) {
        tributary.__config__.trigger("error", err);
      }
      tributary.__config__.trigger("tick", tributary.t);
    }
    
    //Clones
    tributary.events.on("prerender", function() {
      if(tributary.clones && config.get("display") === "svg") { 
        //$(tributary.clones.node()).empty(); 
        tributary.clones.remove();
        tributary.__svg__.select("g.base").remove();
      }
      if(tributary.bv) {
        makeClones();
      } else {
        tributary.g = tributary.__svg__;
      }
    });
  }

  function destroy() {
  }

  //TODO: make canvas clones
  //This function 
  makeClones = function() {
    //create the clone and tributary g elements if they don't exist
    var svg = tributary.__svg__;
    tributary.clones = svg.selectAll("g.clones")
      .data([0]);
    tributary.clones
      .enter()
      .append("g").attr("class", "clones");
    tributary.g = svg
      .append("g").attr("class", "base");

    //make n frames with lowered opacity
    var frames = d3.range(tributary.nclones);
    var gf = tributary.clones.selectAll("g.bvclone")
      .data(frames).enter()
      .append("g")
        .attr("class", "bvclone")
        .style("opacity", tributary.clone_opacity);

    gf.each(function(d, i) {
      var j = i;
      var frame = d3.select(this);
      if(tributary.init)
        tributary.init(frame, j);
      //tributary.run(i/tributary.nclones, frame, i);
      var t = tributary.ease(j/(tributary.nclones-1));
      tributary.run(frame, t, j);
    });
    /*
    if(tributary.init) 
      tributary.init(gbase, 0);
    tributary.run(gbase, 0, 0);
    */
  }

  return plugin;

}
