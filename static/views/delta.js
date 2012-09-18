(function() {

    tributary.Delta = tributary.Tributary.extend({
        //For exploring transitions
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
                var svg = d3.select(".tributary_svg");
                eval(js);
                this.trigger("noerror");
            } catch (e) {
                this.trigger("error", e);
            }

            if(tributary.bv) {
                //d3.selectAll(".bvclone").remove(); 
                try {
                    $('#clones').empty();
                    tributary.make_clones();
                } catch (er) {
                    this.trigger("error", er);
                }
            }
            try {
                $("#delta").empty();
                //we exec the user defined append code
                tributary.init(tributary.g, 0);
                //then we run the user defined run function
                //tributary.run(tributary.t, tributary.g)
                tributary.execute();
            } catch (err) {
                this.trigger("error", err);
            }
            return true;
        }
    });
    
    tributary.make_clones = function() {
        //make n frames with lowered opacity
        var svg = d3.select("#clones");
        var frames = d3.range(tributary.nclones);
        var gf = svg.selectAll("g.bvclone")
            .data(frames).enter()
            .append("g")
                .attr("class", "bvclone")
                .style("opacity", tributary.clone_opacity);

        gf.each(function(d, i) {
            var j = i+1;
            var frame = d3.select(this);
            tributary.init(frame, j);
            //tributary.run(i/tributary.nclones, frame, i);
            var t = tributary.ease(j/(tributary.nclones+1));
            tributary.run(frame, t, j);
        });
    };



    //time slider
    //window.delta = {}
    //var delta = window.delta;
    //we will keep track of our t parameter for the user
    tributary.t = 0.01;  //start at .01 so we don't trigger a flip at the start
    //use this to control playback
    tributary.pause = true;
    //default loop mode
    //tributary.loop = "off";
    tributary.loop = "period";
    //tributary.loop = "pingpong";
    //d3.select("#pingpong_button").style("background-color", "#e3e3e3")
    $("#"+tributary.loop+"_button").addClass("selected-button");

    tributary.reverse = false;

    //TODO: expose these with dat.GUI (especially for the easing functions)
    //default duration for playback
    tributary.duration = 3000;


    //default easing function
    tributary.ease = d3.ease("ease-in");

    //default opacity for clones
    tributary.clone_opacity = 0.4;


    //default number of clones to use for BV mode
    tributary.nclones = 10;

    tributary.clones = d3.select("svg").append("g").attr("id", "clones");
    tributary.g = d3.select("svg").append("g").attr("id", "delta");

    //user is responsible for defining this
    //by default we just show simple text
    tributary.run = function(g,t,i) {
        //$('svg').empty();
        $('#delta').empty();
        g.append("text")
            .text("t: " + t)
            .attr("font-size", 60)
            .attr("dy", "1em");
    };


    //this is a wrapper 
    tributary.execute = function() {
        try {
            //tributary.run(tributary.ease(tributary.t), tributary.g, 0)
            tributary.run(tributary.g, tributary.ease(tributary.t), 0);
        } catch (e) {}
    };

    /*
    var pause = false;
    d3.timer(function() {
        if(pause) return false;
    })
    */



    // create delta's time slider
    /*
    var time_slider = $('#time_slider');
    time_slider.slider({
        slide: function(event, ui) {
            //console.log("ui.value", ui.value);
            //set the current t to the slider's value
            tributary.t = ui.value;
            //call the run function with the current t
            tributary.execute();
        },
        min: 0,
        max: 1,
        step: 0.01,
        value: tributary.t
    });
    */

    $('#slider').on('change', function() {
        tributary.t = parseFloat(this.value);//$('#slider').attr('value');
        if($("#play_button").hasClass("playing")){

        }
        else {
            tributary.execute();    
        }
        

    })

    //we need to save state of timer so when we pause/unpause or manually change slider
    //we can finish a transition
    tributary.timer = {
        then: new Date(),
        duration: tributary.duration,
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

        
        if(tributary.t < 1) {
            tributary.pause = !tributary.pause;
    //        play_button.addClass("playing");
            
            if(!tributary.pause) {
                //unpausing, so we setup our timer to run
                tributary.timer.then = new Date();
                tributary.timer.duration = (1 - tributary.t) * tributary.duration;
                tributary.timer.ctime = tributary.t;
            }
        }
    });
    /*
     $("#off_button").on("click", function(event) {
        tributary.loop = "off"
         d3.selectAll(".select").style("background-color", null)
          $('.select').removeClass("selected-button");
          $("#play_button").removeClass("playing");
         $("#off_button").addClass("selected-button")
    })
     
    $("#loop_button").on("click", function(event) {
        tributary.loop = "period"
         d3.selectAll(".select").style("background-color", null)
         $('.select').removeClass("selected-button");
         $("#loop_button").addClass("selected-button")
    })
     $("#pingpong_button").on("click", function(event) {
        tributary.loop = "pingpong"
         d3.selectAll(".select").style("background-color", null)
          $('.select').removeClass("selected-button");
         $("#pingpong_button").addClass("selected-button")
    })
    */
     
    tributary.bv = false;
    var bv_button = $("#bv_button");
    bv_button.on("click", function(event) {
        tributary.bv = !tributary.bv;
        if(tributary.bv)
        {
            //d3.select("#bv_button").style("background-color", "#e3e3e3")
            bv_button.addClass("playing");
            tributary.make_clones();
            //re-init tributary (appending a bunch of defs can be problematic)
            $("#delta").empty();
            tributary.init(tributary.g, 0);
            tributary.execute();

        }
        else
        {
            //d3.select("#bv_button").style("background-color", null)
            bv_button.removeClass("playing");
            //d3.selectAll(".bvclone").remove();
            $('#clones').empty();
        }
    });



    d3.timer(function() {
        //if paused lets not execute
        if(tributary.pause) { return false; }

        var now = new Date();
        var dtime = now - tributary.timer.then;
        var dt;
        if (tributary.reverse) {
            dt = tributary.timer.ctime * dtime / tributary.timer.duration * -1;
        }
        else {
            dt = (1 - tributary.timer.ctime) * dtime / tributary.timer.duration;
        }
        tributary.t = tributary.timer.ctime + dt;
        

        //once we reach 1, lets pause and stay there
        if(tributary.t >= 1 || tributary.t <= 0 || tributary.t === "NaN")
        {
            if(tributary.loop === "period") {
                tributary.t = 0;
                tributary.timer.then = new Date();
                tributary.timer.duration = tributary.duration;
                tributary.timer.ctime = tributary.t;
                tributary.reverse = false;
                //tributary.pause = false;
            } else if (tributary.loop === "pingpong") {
                //this sets tributary.t to 0 when we get to 0 and 1 when we get to 1 (because of the direction we were going)
                tributary.t = !tributary.reverse;
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
                }
            }
        }

        //not sure why we get true and false for 1 and 0 when range hits the end
        if(tributary.t === true) { tributary.t = 1; }
        if(tributary.t === false) { tributary.t = 0; }

        
        //console.log("T", tributary.t)
        //move the slider
        //time_slider.slider('option', 'value', tributary.t);

        $('#slider').attr('value', tributary.t);
        //update the function (there is probably a way to have the slider's
        //function get called programmatically)
        tributary.execute();
        /*
        try {
            tributary.run(tributary.t)
        } catch (e) {}
        */
    });



}());



