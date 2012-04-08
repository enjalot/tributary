$(function() {

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

		// save it in local storage
		setLocalStorageValue('code', thisCode);
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
