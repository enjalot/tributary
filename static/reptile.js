$(function() {
    tributary.make_clones = function() {
        //make n frames with lowered opacity
        var svg = d3.select("#clones");
        var frames = d3.range(tributary.nclones);
        var gf = svg.selectAll("g.tileclone")
            .data(frames).enter()
            .append("g")
                .attr("class", "tileclone");
                //.style("opacity", tributary.clone_opacity);
        
        gf.each(function(d, i) {
            var frame = d3.select(this);
            tributary.initialize(frame);
            //tributary.run(i/tributary.nclones, frame);
        });
    };

    tributary.layout = function() {
        var svg = d3.select("#clones");
        var sw = window.screen.width;
        var sh = window.screen.height;
        tributary.g_width = sw/3;
        tributary.g_height = sh/3;
        var tileclones = svg.selectAll("g.tileclone")
            .attr("transform", function(d,i) {
                var x = tributary.g_width * (i % 3);
                //console.log("x", i, x)
                var y = tributary.g_height * parseInt(i/3);
                return "translate(" + [x,y] + ")";
            });
    };

    //time slider
    //window.reptile = {}
    //var reptile = window.reptile;
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
    tributary.ease = d3.ease("linear");

    //default opacity for clones
    tributary.clone_opacity = 0.4;


    //default number of clones to use for BV mode
    tributary.nclones = 9;

    tributary.clones = d3.select("svg").append("g").attr("id", "clones");
    tributary.g = d3.select("svg").append("g").attr("id", "reptile");

    //user is responsible for defining this
    //by default we just show simple text
    tributary.run = function(t, g) {
        
        //$('svg').empty();
        $('#reptile').empty();
        g.append("text")
            .text("t: " + t)
            .attr("font-size", 60)
            .attr("dy", "1em");
    }


    //this is a wrapper 
    tributary.execute = function() {
        try {
            tributary.run(tributary.ease(tributary.t), tributary.g)
        } catch (e) {}
    }


})



