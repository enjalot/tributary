(function() {
    tributary.Reptile = tributary.Tributary.extend({
        //For making tiles with tributary code
        initialize: function() {
            this.binder();
            this.set({code: 'g.append("rect").attr("width", 100).attr("height", 100);'});
        },
        execute: function() {
            delete tributary.initialize;
            try {
                code = "tributary.initialize = function(g) {";
                code += this.get("code");
                code += "};";
                eval(code);
                $('#clones').empty();
                tributary.make_clones();
                this.trigger("noerror");
            } catch (e) {
                this.trigger("error",e);
            }
            return true;
        }
    });

    tributary.make_clones = function() {
        var svg = d3.select("#clones");

        //this is screen width not browser width...
        //might work out better anyway (largest potential pattern)
        var sw = window.screen.width;
        var sh = window.screen.height;
        var nx = parseInt(sw/tributary.g_width, 10)+2;
        var ny = parseInt(sh/tributary.g_height, 10)+2;
        var data = d3.range(nx*ny);

        var gf = svg.selectAll("g.tileclone")
            .data(data);

        gf.enter()
            .append("g")
            .attr("class", "tileclone");

        gf.exit().remove();
        
        gf.each(function(d, i) {
            var tile = d3.select(this);
            tributary.initialize(tile);
        })
        .attr("transform", function(d,i) {
            var x = tributary.g_width * (i % nx);
            var y = tributary.g_height * parseInt(i/nx, 10);
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
    //$("#"+tributary.loop+"_button").addClass("selected-button");

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

    //TODO: switch to use elements!
    tributary.clones = d3.select("svg").append("g").attr("id", "clones");
    tributary.g = d3.select("svg").append("g").attr("id", "reptile");

    //user is responsible for defining this
    //by default we just show simple text
    tributary.run = function(t, g) {
        //$('svg').empty();
        $('#reptilesvg').empty();
        g.append("text")
            .text("t: " + t)
            .attr("font-size", 60)
            .attr("dy", "1em");
    };

    //this is a wrapper 
    tributary.execute = function() {
        try {
            tributary.run(tributary.ease(tributary.t), tributary.g);
        } catch (e) {}
    };

}());

