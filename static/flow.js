tributary.enabled = false;
//$("#play_button").css("opacity", "0.3");

//for some reason i needed to move the audio stuff out into global namespace. could use some refactoring for sure
var context;
var source;
var analyser;
var buffer;
var audioBuffer;



$(function() {


//time slider
//we will keep track of our t parameter for the user
tributary.t = 0.01; //start at .01 so we don't trigger a flip at the start
//use this to control playback
tributary.pause = true;


//TODO: expose these with dat.GUI (especially for the easing functions)
//default duration for playback
tributary.duration = 3000;



//default easing function
tributary.ease = d3.ease("linear");

tributary.g = d3.select("#flowsvg").append("g").attr("id", "flow");

//user is responsible for defining this
//by default we just show simple text
tributary.run = function(t, g) {
	//$('svg').empty();
	$('#flowsvg').empty();
    g.append("text")
        .text("t: " + t)
        .attr("font-size", 60)
        .attr("dy", "1em")
    
}


tributary.execute = function() {
    try {
        //tributary.run(tributary.ease(tributary.t), tributary.g)
        tributary.run(tributary.g)
    } catch (e) {}
}




tributary.findex = 41;

var barw = 1024;
var barn = 1024
var barh = 50;
//create flow bars for showing the frequency
var flowgram = d3.select("#flowgram")
var barg = flowgram.append("g").attr("id", "flowbars")
var empty = _.map(d3.range(1024), function(d) { return 0 }) 
var bars = barg.selectAll("rect.flowbar")
    .data(empty)
    .enter()
    .append("rect")
        .attr("class", "flowbar")
        .attr("width", (barw)/barn)
        .attr("height", 0)
        .attr("fill", "#0000dd")
        .attr("opacity", 0.5)
        .attr("transform", function(d,i) {
            var x = i * barw/barn
            var y = 0
            return "translate(" + [x, y]  + ")";
        })

$("#flowgram").on("click", function(e) {
    //console.log(e.offsetX, e.offsetY)
    tributary.findex = e.offsetX;
})


tributary.update = function() {
    //update the bars showing the frequency
    freq = getFreq();
    d3.selectAll(".flowbar").data(freq)
        .attr("height", function(d, i) { return barh * d/255 })
        .attr("transform", function(d,i) {
            var x = i * barw/barn
            //var y = barh - barh * d/255
            var y = 0;
            return "translate(" + [x, y]  + ")";
        })
        .attr("fill", function(d,i) {
            if(i === tributary.findex) {
                return "#ff0000";
            } else {
                return "#0000ff";
            }
        }) 


}


// create flow's time slider
/*
var time_slider = $('#time_slider');
time_slider.slider({
	slide: function(event, ui) {
        //console.log("ui.value", ui.value);
        //set the current t to the slider's value
        tributary.t = ui.value
        //call the run function with the current t
        run(tributary.g)
 	},
    min: 0,
    max: 1,
    step: .01,
    value: tributary.t
});
*/



var play_button = $("#play_button")

play_button.on("click", function(event) {
    console.log(tributary.enabled)
    if(!tributary.enabled) return false;

    if(tributary.t < 1) {
        tributary.pause = !tributary.pause;
        if(!tributary.pause) {
                        
            
            $("#play_button").css("background-color", "#FF3659");
            $("#play_button").css("color", "white");
            $("#play_button").text("Stop");
            play_button.text("Stop");
//            play_button.addClass("animated flash");
            
            
            
            play(0)
        } else {
            stop(0)
            $("#play_button").css("color", "black");            
            $("#play_button").css("background-color", "");
            $("#play_button").text("Play");
            
        }
    }
})

d3.timer(function() {
    //if paused lets not execute
    if(tributary.pause) return false;

    tributary.update()
    tributary.execute()

})



});



function loadAudioBuffer(url) {
    // Load asynchronously

    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    request.onload = function() { 
        audioBuffer = context.createBuffer(request.response, false /*true*/);
        finishLoad();  // add in the slider, etc. now that we've loaded the audio
    }

    request.send();
}

function initAudio() {
    context = new webkitAudioContext();
    
    source = context.createBufferSource();
    analyser = context.createAnalyser();
    analyser.fftSize = 2048;

    // Connect audio processing graph
    source.connect(analyser);
    analyser.connect(context.destination);
    console.log("analyser", analyser)

    //loadAudioBuffer("/static/sounds/human-voice.mp4");
    loadAudioBuffer("/static/sounds/truth.mp3");
}

//TODO: be more careful with starting contexts, if you start 2 you cant stop the first one
//this is because you lose reference to that context. managing multiple contexts would allow for multiple songs
function play(when) {
    source = context.createBufferSource();
    analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    source.buffer = audioBuffer;
    //source.connect(context.destination);
    source.connect(analyser);
    analyser.connect(context.destination);

    source.noteOn(when);
}

function stop(when) {
    source.buffer = audioBuffer;
    source.connect(analyser);
    source.noteOff(when);
}

function seek(when, time, offset) {
    source = context.createBufferSource();
    analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    source.buffer = audioBuffer;
    source.connect(analyser);
    analyser.connect(context.destination);

    source.noteGrainOn(when, time, offset);

}

function getFreq() {
    //try {
        analyser.smoothingTimeConstant = 0.75;
        analyser.getByteFrequencyData(freqByteData);
        /*
    }
    catch(e) {
        freqByteData = empty
    }
    */
    return freqByteData;
}

function finishLoad() {
    source.buffer = audioBuffer;
    //source.looping = true;

    freqByteData = new Uint8Array(analyser.frequencyBinCount);
    console.log("ENABLED")
    tributary.enabled = true;
//    $("#play_button").css("background-color", "#0f0")
    $("#play_button").css("opacity", "1");

    //source.noteOn(0.0);
    //window.requestAnimationFrame(draw);
}

initAudio()


