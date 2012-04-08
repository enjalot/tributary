$(function() {


//time slider
window.delta = {}
var delta = window.delta;
//we will keep track of our t parameter for the user
delta.t = 0
//use this to control playback
delta.pause = true

//TODO: expose these with dat.GUI (especially for the easing functions)
//default duration for playback
delta.duration = 3000;

//default easing function
delta.ease = d3.ease("linear")

//user is responsible for defining this
//by default we just show simple text
delta.run = function(t) {
	$('svg').empty();
    var svg = d3.select("svg")
    svg.append("text")
        .text("t: " + t)
        .attr("font-size", 60)
        .attr("dy", "1em")
}

//this is a wrapper 
var run = function() {

    try {
        delta.run(delta.ease(delta.t))
    } catch (e) {}
}

/*
var pause = false;
d3.timer(function() {
    if(pause) return false;
})
*/



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
	$('svg').empty();

	try {
		// get the ide code
		var thisCode = window.aceEditor.getSession().getValue();


		// run it
		eval(thisCode);
		//eval(run_func);

        run()

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
		slider.offset({top: sliderTop, left: sliderLeft});

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

// create delta's time slider
var time_slider = $('#time_slider');
time_slider.slider({
	slide: function(event, ui) {
        //console.log("ui.value", ui.value);
        //set the current t to the slider's value
        delta.t = ui.value
        //call the run function with the current t
        run()
    /*
        try {
            delta.run(delta.t)
        } catch (e) {}
        */
	},
    min: 0,
    max: 1,
    step: .01,
    value: delta.t
});

//we need to save state of timer so when we pause/unpause or manually change slider
//we can finish a transition
delta.timer = {
    then: new Date(),
    duration: delta.duration,
    ctime: delta.t
}

var play_button = $("#play_button")
play_button.on("click", function(event) {
    if(delta.t < 1) {
        delta.pause = !delta.pause;
        if(!delta.pause) {
            //unpausing, so we setup our timer to run
            delta.timer.then = new Date();
            delta.timer.duration = (1 - delta.t) * delta.duration
            delta.timer.ctime = delta.t
        }
    }
})

d3.timer(function() {
    //if paused lets not execute
    if(delta.pause) return false;

    var now = new Date();
    var dtime = now - delta.timer.then;
    var dt = (1 - delta.timer.ctime) * dtime / delta.timer.duration;
    delta.t = delta.timer.ctime + dt;
    

    //once we reach 1, lets pause and stay there
    if(delta.t >= 1 || delta.t === "NaN")
    {
        delta.t = 1;
        delta.pause = true;
    }
    
    //move the slider
    time_slider.slider('option', 'value', delta.t);
    //update the function (there is probably a way to have the slider's
    //function get called programmatically)
    run()
    /*
    try {
        delta.run(delta.t)
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
