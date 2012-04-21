//tributary.enabled = false;
tributary.enabled = false;
$("#play_button").css("opacity", "1");
//$("#play_button").css("opacity", "0.3");

//for some reason i needed to move the audio stuff out into global namespace. could use some refactoring for sure
var context;
var source;
var analyser;
var buffer;
var audioBuffer;



$(function() {

    /*
    midiBridge.init(function(midiEvent) {
        console.log(midiEvent);
    });
    */

    $(document).ready(function() { 
        midiBridge.init({ 
            connectAllInputs: true,
            ready: function(msg){
                //console.log(msg)
                tributary.enabled = true;
            },
            error: function(msg) {
                console.log(msg);
            },
            data: function(midiEvent) {
                var m = midiEvent;
                try {
                    console.log(m.noteName, m.data1, m.data2);
                } catch (e) {}
            }
        });
    });


    
    //time slider
    //we will keep track of our t parameter for the user
    tributary.t = 0.01; //start at .01 so we don't trigger a flip at the start
    //use this to control playback
    //tributary.pause = false;
    tributary.pause = true;
    //TODO: expose these with dat.GUI (especially for the easing functions)
    //default duration for playback
    tributary.duration = 3000;
    //default easing function
    tributary.ease = d3.ease("linear")

    tributary.g = d3.select("#fountainsvg").append("g").attr("id", "fountain")

    //user is responsible for defining this
    //by default we just show simple text
    tributary.run = function(t, g) {
        //$('svg').empty();
        $('#fountain').empty();
        g.append("text")
            .text("t: " + t)
            .attr("font-size", 60)
            .attr("dy", "1em")
        
    }


    tributary.execute = function() {
        try {
            tributary.run(tributary.ease(tributary.t), tributary.g)
        } catch (e) {}
    }

    var gview = new tributary.FountainView();
    gview.render()

    tributary.findex = 41;

    

    //TODO: make this learning function
    tributary.pads = _.map(d3.range(16), function(d) {
        var pad = {
            id: d,
            f: 0,
            start: function() {
                //TODO: expand this 
                this.f = 1;
            },
            stop: function() {
                this.f = 0;
            },
            get: function() {
                return this.f;
            },
            update: function(t) {
                //TODO: implement a pulse or any other easing function
                //for holding down the pad longer
            }
        }


        return pad;
    })


    tributary.update = function() {

    }


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
                //play(0)
            } else {
                //stop(0)
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
    //console.log(freqByteData[10])
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

//initAudio()


