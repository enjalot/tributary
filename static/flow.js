window.flow = {}
var flow = window.flow;
flow.enabled = false
$("#play_button").css("background-color", "rgba(255, 0, 0, .5)")

//for some reason i needed to move the audio stuff out into global namespace. could use some refactoring for sure
var context;
var source;
var analyser;
var buffer;
var audioBuffer;



$(function() {


//time slider
//we will keep track of our t parameter for the user
flow.t = 0.01  //start at .01 so we don't trigger a flip at the start
//use this to control playback
flow.pause = true
//default loop mode
//flow.loop = "off";
//flow.loop = "period";
flow.loop = "pingpong";
d3.select("#pingpong_button").style("background-color", "#e3e3e3")


flow.reverse = false;

//TODO: expose these with dat.GUI (especially for the easing functions)
//default duration for playback
flow.duration = 3000;



//default easing function
flow.ease = d3.ease("linear")

//default opacity for clones
flow.clone_opacity = 0.4;


//default number of clones to use for BV mode
flow.nclones = 10;

flow.clones = d3.select("#flowsvg").append("g").attr("id", "clones")
flow.g = d3.select("#flowsvg").append("g").attr("id", "flow")

//user is responsible for defining this
//by default we just show simple text
flow.run = function(t, g) {
    
	//$('svg').empty();
	$('#flow').empty();
    g.append("text")
        .text("t: " + t)
        .attr("font-size", 60)
        .attr("dy", "1em")
    
}


//this is a wrapper 
var run = function(g) {
    try {
        flow.run(flow.ease(flow.t), g)
    } catch (e) {}
}



flow.findex = 41;

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
    flow.findex = e.offsetX;
})


flow.update = function() {
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
            if(i === flow.findex) {
                return "#ff0000";
            } else {
                return "#0000ff";
            }
        }) 


}



window.aceEditor = ace.edit("editor");

// set the theme
window.aceEditor.setTheme("ace/theme/twilight");

// set mode to javascript
var JavaScriptMode = require("ace/mode/javascript").Mode;
window.aceEditor.getSession().setMode(new JavaScriptMode());

window.tributary = d3.dispatch("create", "destroy")

// redraw svg when we update our code
window.aceEditor.getSession().on('change', function() {
    //send an event
    window.tributary.destroy()

	// clear the window
	//$('svg').empty();
	$('#flow').empty();
    //flow.g = d3.select("svg").append("g").attr("id", "flow")

	try {
		// get the ide code
		var thisCode = window.aceEditor.getSession().getValue();

		// run it
		eval(thisCode);
		//eval(run_func);

        if(flow.bv) {
            //d3.selectAll(".bvclone").remove(); 
            $('#clones').empty()
            make_clones();
        }
        //we exec the user defined append code
        flow.append(flow.g)
        //then we run the user defined run function
        run(flow.g)

		// save it in local storage
		//setLocalStorageValue('code', thisCode);
	}
	catch (error) {}
	finally {};
    window.tributary.create()
});

if(window.tributary_gist && window.tributary_filename)
{
    var src_url = "/tributary/api/" + window.tributary_gist  + "/" + window.tributary_filename
    //console.log("URL??", window.tributary_gist, window.tributary_filename)
    //d3.text('http://gabrielflor.it/static/submodule/water/data/chord.txt', function(data) {
    d3.text(src_url, function(data) {
        // do we have stored code? if not, set the demo code
        //window.aceEditor.getSession().setValue(getLocalStorageValue('code') ? getLocalStorageValue('code') : data);
        window.aceEditor.getSession().setValue(data);
    });
}

// local storage getter/setter
function getLocalStorageValue(key) {
	var localStorageKey = 'gabrielflor.it/water1';
	return localStorage.getItem([localStorageKey, key].join('/'));
}
function setLocalStorageValue(key, value) {
	var localStorageKey = 'gabrielflor.it/water1';
	localStorage.setItem([localStorageKey, key].join('/'), value);
}

// if we click on a numeric constant, select the token and show the slider
var chosenRow, chosenColumn;
var onNumeric = false;
window.aceEditor.on("click", function(e) {

	var editor = e.editor;
	var pos = editor.getCursorPosition();
	var token = editor.session.getTokenAt(pos.row, pos.column);
	onNumeric = false;

	// did we click on a number?
	if (token && /\bconstant.numeric\b/.test(token.type)) {

		// stop pulsing numerics
		if (pulseNumerics) {
			window.clearInterval(pulse);
			pulseNumerics = false;
		}

		// set the slider params based on the token's numeric value
		// TODO: there has to be a better way of setting this up
		// TODO: feels pretty silly at the moment
		if (token.value == 0) {
			var sliderRange = [-100, 100];
		} else {
			var sliderRange = [-token.value * 3, token.value * 5];
		}
		slider.slider('option', 'max', d3.max(sliderRange));
		slider.slider('option', 'min', d3.min(sliderRange));

		// slider range needs to be evenly divisible by the step
		if ((d3.max(sliderRange) - d3.min(sliderRange)) > 20) {
			slider.slider('option', 'step', 1);
		} else {
			slider.slider('option', 'step', (d3.max(sliderRange) - d3.min(sliderRange))/200);
		}
		slider.slider('option', 'value', token.value);

		// position slider centered above the cursor
		var scrollerOffset = $('.ace_scroller').offset();
		var cursorOffset = editor.renderer.$cursorLayer.pixelPos;
		var sliderTop = scrollerOffset.top + cursorOffset.top - Number($('#editor').css('font-size').replace('px', ''))*0.8;
		var sliderLeft = scrollerOffset.left + cursorOffset.left - slider.width()/2;

		// sync the slider size with the editor size
		slider.css('font-size', $('#editor').css('font-size'));
		slider.css('font-size', '-=4');
		slider.offset({top: sliderTop - 10, left: sliderLeft});

        //lets turn on the slider no matter what (no alt/ctrl key necessary)
		slider.css('visibility', 'visible'); 

		// allow the slider to be shown
		onNumeric = true;

		// make this position globally scoped
		chosenRow = pos.row;
		chosenColumn = token.start;

		// prevent click event from bubbling up to body, which
		// would then trigger an event to hide the slider
		e.stopPropagation();
	} else {
        //if they click anywhere else turn off the slider
        //TODO: also do this when the hide button is clicked
	    slider.css('visibility', 'hidden');
    }
});

// turn off horizontal scrollbar
window.aceEditor.renderer.setHScrollBarAlwaysVisible(false);

// turn off print margin visibility
window.aceEditor.setShowPrintMargin(false);

// load font-size from local storage
if (getLocalStorageValue('font-size')) {
	$('#editor').css('font-size', getLocalStorageValue('font-size'));
}

// increase/decrease font
$('.font-control').on('click', function(e) {
	e.preventDefault();

	if ($(this).attr('class').indexOf('decrease') != -1) {
		$('#editor').css('font-size', '-=1');
	} else {
		$('#editor').css('font-size', '+=1');
	}

	setLocalStorageValue('font-size', $('#editor').css('font-size'));
});

// from https://github.com/ajaxorg/ace/issues/305
// this replaces the current replace functionality
// replace just replaces the current selection with the replacement text,
// and highlights the replacement text
// it does not go to the next selection (which the default version does)
window.aceEditor.replace = function(replacement) {
	var range = this.getSelectionRange();
	if (range !== null) {
		this.$tryReplace(range, replacement);
		if (range !== null)
			this.selection.setSelectionRange(range);
	}
}

// create slider
var slider = $('#slider');
slider.slider({
	slide: function(event, ui) {

		// set the cursor to desired location
		var cursorPosition = window.aceEditor.getCursorPosition();
		if (!(cursorPosition.row == chosenRow && cursorPosition.column == chosenColumn)) {
			window.aceEditor.getSelection().moveCursorTo(chosenRow, chosenColumn);

			// clear selection
			window.aceEditor.clearSelection();
		}

		// get token
		var token = window.aceEditor.session.getTokenAt(chosenRow, chosenColumn + 1);

		// find and replace
		window.aceEditor.find(String(token.value));
		window.aceEditor.replace(String(ui.value));
	}
});

// use control key on linux, alt key everywhere else
var sliderKey = navigator && navigator.platform && navigator.platform.toLowerCase().indexOf('linux') != -1
	? 'ctrl' : 'alt';

// display slider key on page
$('#sliderKey').text(sliderKey);

// trigger slider on control
$('textarea').bind('keydown.' + sliderKey, function(e) {
	// are we on a token?
	if (onNumeric) {
		slider.css('visibility', 'visible'); 
	}
}).bind('keyup.' + sliderKey, function(e) {
	slider.css('visibility', 'hidden');
});

$('#slider').bind('keyup.' + sliderKey, function(e) {
	slider.css('visibility', 'hidden');
});

// create flow's time slider
/*
var time_slider = $('#time_slider');
time_slider.slider({
	slide: function(event, ui) {
        //console.log("ui.value", ui.value);
        //set the current t to the slider's value
        flow.t = ui.value
        //call the run function with the current t
        run(flow.g)
 	},
    min: 0,
    max: 1,
    step: .01,
    value: flow.t
});
*/

//we need to save state of timer so when we pause/unpause or manually change slider
//we can finish a transition
flow.timer = {
    then: new Date(),
    duration: flow.duration,
    ctime: flow.t
}

var play_button = $("#play_button")

play_button.on("click", function(event) {
    console.log(flow.enabled)
    if(!flow.enabled) return false;

    if(flow.t < 1) {
        flow.pause = !flow.pause;
        if(!flow.pause) {
            play(0)
            //unpausing, so we setup our timer to run
            flow.timer.then = new Date();
            flow.timer.duration = (1 - flow.t) * flow.duration
            flow.timer.ctime = flow.t
        } else {
            stop(0)
        }
    }
})
 $("#off_button").on("click", function(event) {
    flow.loop = "off"
     d3.selectAll(".select").style("background-color", null)
     d3.select("#off_button").style("background-color", "#e3e3e3")
})
 
$("#loop_button").on("click", function(event) {
    flow.loop = "period"
     d3.selectAll(".select").style("background-color", null)
     d3.select("#loop_button").style("background-color", "#e3e3e3")
})
 $("#pingpong_button").on("click", function(event) {
    flow.loop = "pingpong"
     d3.selectAll(".select").style("background-color", null)
     d3.select("#pingpong_button").style("background-color", "#e3e3e3")
})
 
var make_clones = function() {
    //make n frames with lowered opacity
    var svg = d3.select("#clones")
    var frames = d3.range(flow.nclones)
    var gf = svg.selectAll("g.bvclone")
        .data(frames).enter()
        .append("g")
            .attr("class", "bvclone")
            .style("opacity", flow.clone_opacity)

    gf.each(function(d, i) {
        var frame = d3.select(this)
        flow.append(frame)
        flow.run(i/flow.nclones, frame)
    })
    console.log("clones made")
}

flow.bv = false;
$("#bv_button").on("click", function(event) {
    flow.bv = !flow.bv;
    if(flow.bv)
    {
        d3.select("#bv_button").style("background-color", "#e3e3e3")
        make_clones();
    }
    else
    {
        d3.select("#bv_button").style("background-color", null)
        d3.selectAll(".bvclone").remove()
    }
})



d3.timer(function() {
    //if paused lets not execute
    if(flow.pause) return false;

    var now = new Date();
    var dtime = now - flow.timer.then;
    if (flow.reverse) {
        var dt = flow.timer.ctime * dtime / flow.timer.duration * -1;
    }
    else {
        var dt = (1 - flow.timer.ctime) * dtime / flow.timer.duration;
    }
    flow.t = flow.timer.ctime + dt;
    

    //once we reach 1, lets pause and stay there
    if(flow.t >= 1 || flow.t <= 0 || flow.t === "NaN")
    {
        if(flow.loop === "period") {
            flow.t = 0;
            flow.timer.then = new Date();
            flow.timer.duration = flow.duration;
            flow.timer.ctime = flow.t;
            flow.reverse = false;
            //flow.pause = false;
        } else if (flow.loop === "pingpong") {
            //this sets flow.t to 0 when we get to 0 and 1 when we get to 1 (because of the direction we were going)
            flow.t = !flow.reverse
            flow.timer.then = new Date();
            flow.timer.duration = flow.duration;
            flow.timer.ctime = flow.t;
            flow.reverse = !flow.reverse;
        }
        else {
            if (flow.t != 0)
            {
                flow.t = 1;
                flow.pause = true;
            }
        }
    }
    
    //move the slider
    //time_slider.slider('option', 'value', flow.t);
    //update the function (there is probably a way to have the slider's
    //function get called programmatically)
    run(flow.g)

    flow.update()
    /*
    try {
        flow.run(flow.t)
    } catch (e) {}
    */
})



// we're not a numeric, by default
// if we are, the editor click will handle it
$('body').on('focus click', function(e) {
	onNumeric = false;
});

// pulse numeric constants (until user clicks on them)
var pulseNumerics = true;
var pulse = setInterval(function() {
	$('.ace_numeric').animate({opacity: 0.5}).animate({opacity: 1});
}, 1000);



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
    flow.enabled = true;
    $("#play_button").css("background-color", "#0f0")

    //source.noteOn(0.0);
    //window.requestAnimationFrame(draw);
}

initAudio()


