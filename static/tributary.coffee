
#TODO: make this use the bb model id so each model can save itself
#local storage getter/setter
getLocalStorageValue = (key) ->
	localStorageKey = 'tributary/'
	return localStorage.getItem([localStorageKey, key].join('/'))
setLocalStorageValue = (key, value) ->
	localStorageKey = 'tributary/'
	localStorage.setItem([localStorageKey, key].join('/'), value)



class tributary.Tributary extends Backbone.Model
    defaults:
        code: ""
    initialize: ->
        @on("code", @newcode)
        @set({"code":"hi"})
        console.log("GET", @get("code"))

    #TODO: move this to view?
    newcode: (code) =>
        #empty the svg object
        $("svg").empty()

        #run the code
        try
            eval(code)

        #TODO: check that things went well before saving?
        #save the code in the model
        @set({code:code})
        #TODO: store code in local storage

        return true


class tributary.TributaryView extends Backbone.View
    initialize: ->
        #TODO: this should all be in render() 
        #but we assume that the #editor div is present when this class is
        #instanciated. move it once the code is on more solid ground
        @aceEditor = @model.aceEditor
        @chosenRow = 0
        @chosenColumn = 0
        @onNumeric = false
        
        @aceEditor = ace.edit("editor")
        @aceEditor.setTheme("ace/theme/twilight")
        JavaScriptMode = require("ace/mode/javascript").Mode
        @aceEditor.getSession().setMode(new JavaScriptMode())
        #everytime the code changes, we trigger this event
        @aceEditor.getSession().on('change', () =>
            thisCode = @aceEditor.getSession().getValue()
            @model.trigger("code", @aceEditor.getSession().getValue())
        )

        #setup functions
        @init_slider()
        @init_gui()
        
        #fill in the editor with text we get back from the gist
        #console.log(@get("gist"), @get("filename"))
        if(@model.get("gist") && @model.get("filename"))
            src_url = "/tributary/api/" + @model.get("gist")  + "/" + @model.get("filename")
            d3.text(src_url, (data) =>
                if(!data)
                    data = ""
                @aceEditor.getSession().setValue(data)
                @model.trigger("code", data)
            )

        @aceEditor.on("click", @editor_click)
        @

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
            @slider.slider('option', 'value', token.value)

            # position slider centered above the cursor
            scrollerOffset = $('.ace_scroller').offset()
            cursorOffset = editor.renderer.$cursorLayer.pixelPos
            sliderTop = scrollerOffset.top + cursorOffset.top - Number($('#editor').css('font-size').replace('px', ''))*0.8
            sliderLeft = scrollerOffset.left + cursorOffset.left - @slider.width()/2

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
                token = @aceEditor.session.getTokenAt(@chosenRow, @chosenColumn + 1)

                #find and replace
                @aceEditor.find(String(token.value))
                @aceEditor.replace(String(ui.value))
        )

    init_gui: =>
        #Setup the gui elements for this page

        #Setup tweet link
        #var thisurl = window.location.protocol + "//" + window.location.host + "/" + window.location.pathname;
        $('#tweet_this').append("tweet this")
        $('#tweetPanel').on("click", (e) ->
            save_gist((newurl, newgist) ->
                tweetlink = "http://twitter.com/home/?status=See my latest %23tributary here "+"http://enjalot.com" + newurl
                window.location = tweetlink
                #window.open(tweetlink, 'twitte')
            )
        )

        #Setup the save panel
        $('#savePanel').on('click', (e) ->
            save_gist((newurl, newgist) ->
                window.location = newurl
            )
        )

        #Setup Hide the editor button
        he = $('#hideEditor')
        he.on("click", (e) ->
            $("#editor").toggle()
            txt = he.html()
            #console.log("txt", txt)
            if(txt == "Hide")
                he.html("Show")
                $('#slider').css('visibility', 'hidden');
            else
                he.html("Hide")
                #hide the slider if it's open
        )

        #Setup editor settings
        #turn off horizontal scrollbar
        @aceEditor.renderer.setHScrollBarAlwaysVisible(false)
        #turn off print margin visibility
        @aceEditor.setShowPrintMargin(false)
        # load font-size from local storage
        if (getLocalStorageValue('font-size'))
            $('#editor').css('font-size', getLocalStorageValue('font-size'))
        # increase/decrease font
        $('.font-control').on('click', (e) ->
            e.preventDefault()
            if ($(this).attr('class').indexOf('decrease') != -1)
                $('#editor').css('font-size', '-=1')
            else
                $('#editor').css('font-size', '+=1')
            setLocalStorageValue('font-size', $('#editor').css('font-size'))
        )

        # from https://github.com/ajaxorg/ace/issues/305
        # this replaces the current replace functionality
        # replace just replaces the current selection with the replacement text,
        # and highlights the replacement text
        # it does not go to the next selection (which the default version does)
        @aceEditor.replace = (replacement) ->
            range = this.getSelectionRange()
            if (range != null)
                this.$tryReplace(range, replacement)
                if (range != null)
                    this.selection.setSelectionRange(range)
        # we're not a numeric, by default
        # if we are, the editor click will handle it
        $('body').on('focus click', (e) =>
            @onNumeric = false
        )

        # pulse numeric constants (until user clicks on them)
        pulseNumerics = true
        pulse = setInterval(() ->
            $('.ace_numeric').animate({opacity: 0.5}).animate({opacity: 1})
        , 1000)
        @

    save_gist: (callback) =>
        #Save the current code to a public gist
        oldgist = parseInt(@model.get("gist"))
        filename = @model.get("filename")
        if(filename == "")
            filename = "inlet.js"
        #if(!oldgist == "NaN")
            #TODO:
            #this gist already exists, so we can fill in some information
            #like the description
        #console.log("gist #", oldgist, "filename", filename)
        gist = {
            description: 'just another inlet to tributary',
            public: true,
            files: {}
        }
        gist.files[filename] = {
            content: @model.get("code")
        }

        #turn the save button into a saving animation
        d3.select("#saveButton").style("background-image", "url(/static/img/ajax-loader.gif)")
        d3.select("#saveButton").style("background-repeat", "no-repeat")
        d3.select("#saveButton").style("top", "0px")
        #d3.select("#saveButton").text("Saving!")
        
        #console.log("gist", gist)
        #$.post('https://api.github.com/gists', JSON.stringify(gist), function(data) {
        $.post('/tributary/save', {"gist":JSON.stringify(gist)}, (data) ->
            #TODO: fix the flask headers to send back application/json and not text/html
            if(typeof(data) == "string")
                data = JSON.parse(data)
            newgist = data.id
            newurl = "/tributary/" + newgist + "/" + filename
            #console.log("new url", newurl)
            callback(newurl, newgist)
            #window.location = newurl;
        )


