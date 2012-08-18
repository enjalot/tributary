(function() {

    tributary.BigFish = tributary.Tributary.extend({
        //For exploring animations, run loops 
        initialize: function() {
            this.binder();
            this.set({
                code: '\
var txt;\n\
tributary.init = function(g) {\n\
    txt = g.append("text")\n\
      .attr("transform", "translate(" + [100, 100] + ")");\n\
};\n\
tributary.run = function(g,t) {\n\
    txt.text(t);\n\
};'
            });
        },

        execute: function() {
            var js = this.handle_coffee();
            try {
                eval(js);
                this.trigger("noerror");
            } catch (e) {
                this.trigger("error", e);
            }

            try {
                //$("#bigfish").empty();
                //we exec the user defined append code
                //tributary.init(tributary.g);
                //then we run the user defined run function
                tributary.execute();
                this.trigger("noerror");
            } catch (er) {
                this.trigger("error", er);
            }

            return true;
        }
    })
    //time slider
    //window.delta = {}
    //var delta = window.delta;
    //we will keep track of our t parameter for the user
    tributary.t = 0.0;  
    tributary.dt = 0.01; //make steps of 0.01
    //use this to control playback
    tributary.pause = true;

    //d3.select("#pingpong_button").style("background-color", "#e3e3e3")
    $("#"+tributary.loop+"_button").addClass("selected-button");


    //default easing function
    tributary.ease = d3.ease("linear");
    
    tributary.g = d3.select("#bigfishsvg").append("g").attr("id", "bigfish");


    tributary.initialize = function() {
        $("#bigfish").empty();
        delete tributary.nodes;
        tributary.nodes = [];
        tributary.init(tributary.g);
        tributary.execute();
    };

    tributary.nodes = [];

    //user is responsible for defining this
    //by default we just show simple text
    tributary.init= function(g,i) {
    };

    tributary.run = function(g,t,i) {
    };


    //this is a wrapper 
    tributary.execute = function() {
        try {
            //tributary.run(tributary.ease(tributary.t), tributary.g, 0)
            tributary.run(tributary.g, tributary.t, 0);
        } catch (e) {}
    };

    /*
    var pause = false;
    d3.timer(function() {
        if(pause) return false;
    })
    */

    //we need to save state of timer so when we pause/unpause or manually change slider
    //we can finish a transition
    tributary.timer = {
        then: new Date(),
        ctime: tributary.t
    };


    var play_button = $("#play_button");
    play_button.on("click", function(event) {
        if($("#play_button").hasClass("playing")){
                $("#play_button").removeClass("playing");
                play_button.text("Play");
        }
        else if(!$("#play_button").hasClass("playing")){
            play_button.addClass("playing");
            play_button.text("Stop");
            
        }
        
        tributary.pause = !tributary.pause;
//        play_button.addClass("playing");
        
        if(!tributary.pause) {
            //unpausing, so we setup our timer to run
            tributary.timer.then = new Date();
            tributary.timer.ctime = tributary.t;
        }
    });

    var init_button = $("#init_button");
    init_button.on("click", function(event) {
        tributary.initialize();
    });
 


    d3.timer(function() {
        //if paused lets not execute
        if(tributary.pause) { return false; }

        //var now = new Date();
        //var dtime = now - tributary.timer.then;
        //tributary.t = tributary.timer.ctime + dtime;
        tributary.t += tributary.dt;

        tributary.execute();
        /*
        try {
            tributary.run(tributary.t)
        } catch (e) {}
        */
    });


}());



