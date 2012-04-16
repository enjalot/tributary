
class tributary.Tributary extends Backbone.Model
    init: ->
        @aceEditor = ace.edit("editor")
        @aceEditor.setTheme("ace/theme/twilight")

        JavaScriptMode = require("ace/mode/javascript").Mode
        @aceEditor.getSession().setMode(new JavaScriptMode())

        #tributary.events = d3.dispatch("create", "destroy", "code")
        @aceEditor.getSession().on('change', () =>
            thisCode = @aceEditor.getSession().getValue()
            @trigger("code", @aceEditor.getSession().getValue())
        )
        @chosenRow = 0
        @chosenColumn = 0
        @onNumeric = false
        @aceEditor.on("click", @editor_click)

        @init_slider()

        #fill in the editor with text we get back from the gist
        if(@.get("gist") && @get("filename"))
            src_url = "/tributary/api/" + tributary.gist  + "/" + tributary.filename
            #console.log("URL??", window.tributary_gist, window.tributary_filename)
            #d3.text('http://gabrielflor.it/static/submodule/water/data/chord.txt', function(data) {
            d3.text(src_url, (data) =>
                #do we have stored code? if not, set the demo code
                #tributary.aceEditor.getSession().setValue(getLocalStorageValue('code') ? getLocalStorageValue('code') : data);
                @aceEditor.getSession().setValue(data)
            )


    newcode: (code) =>
        #empty the svg object
        @$el.find("svg").empty()

        #save the code in the model
        @set("code", code)
        #TODO: store code in local storage
        
        #run the code
        try
            eval(code)
        
        return true



    
    editor_click: (e) =>
        #most of this code originally comes from the water project by Gabriel Florit
        editor = e.editor
        pos = editor.getCursorPosition()
        token = editor.session.getTokenAt(pos.row, pos.column)
        @onNumeric = false

        #did we click on a number?
        if (token && /\bconstant.numeric\b/.test(token.type))
            # stop pulsing numerics
            if (pulseNumerics)
                window.clearInterval(pulse)
                pulseNumerics = false

            # set the slider params based on the token's numeric value
            # TODO: there has to be a better way of setting this up
            # TODO: feels pretty silly at the moment
            if (token.value == 0)
                sliderRange = [-100, 100]
            else
                sliderRange = [-token.value * 3, token.value * 5]

            @slider.slider('option', 'max', d3.max(sliderRange))
            @slider.slider('option', 'min', d3.min(sliderRange))

            # slider range needs to be evenly divisible by the step
            if ((d3.max(sliderRange) - d3.min(sliderRange)) > 20)
                @slider.slider('option', 'step', 1)
            else
                @slider.slider('option', 'step', (d3.max(sliderRange) - d3.min(sliderRange))/200)
            slider.slider('option', 'value', token.value)

            # position slider centered above the cursor
            scrollerOffset = $('.ace_scroller').offset()
            cursorOffset = editor.renderer.$cursorLayer.pixelPos
            sliderTop = scrollerOffset.top + cursorOffset.top - Number($('#editor').css('font-size').replace('px', ''))*0.8
            sliderLeft = scrollerOffset.left + cursorOffset.left - slider.width()/2

            # sync the slider size with the editor size
            @slider.css('font-size', $('#editor').css('font-size'))
            @slider.css('font-size', '-=4')
            @slider.offset({top: sliderTop - 10, left: sliderLeft})

            #lets turn on the slider no matter what (no alt/ctrl key necessary)
            @slider.css('visibility', 'visible')

            # allow the slider to be shown
            @onNumeric = true

            # make this position globally scoped
            @chosenRow = pos.row
            @chosenColumn = token.start

            # prevent click event from bubbling up to body, which
            # would then trigger an event to hide the slider
            e.stopPropagation()
        else
            #if they click anywhere else turn off the slider
            #TODO: also do this when the hide button is clicked
            @slider.css('visibility', 'hidden')

    
    init_slider: =>
        #create slider
        @slider = $('#slider')
        @slider.slider(
            slide: (event, ui) =>
                #set the cursor to desired location
                cursorPosition = @aceEditor.getCursorPosition()
                if (!(cursorPosition.row == @chosenRow && cursorPosition.column == @chosenColumn))
                    @aceEditor.getSelection().moveCursorTo(@chosenRow, @chosenColumn)

                    #clear selection
                    @aceEditor.clearSelection()

                #get token
                token = @aceEditor.session.getTokenAt(chosenRow, chosenColumn + 1)

                #find and replace
                @aceEditor.find(String(token.value))
                @aceEditor.replace(String(ui.value))
        )
