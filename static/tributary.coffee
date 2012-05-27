
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
        @on("execute", @execute)

    execute: () =>
        #empty the svg object
        #run the code
        try
            svg = d3.select("svg")
            #delete tributary.initialize
            #eval(@get("code"))
            #wrap the code in a closure
            code = "tributary.initialize = function(g) {"
            code += @get("code")
            code += "};"
            eval(code)
            tributary.initialize(d3.select("svg"))
            @trigger("noerror")
        catch e
            @trigger("error", e)
            return false

        #we don't want it to nuke the svg if there is an error
        try
            $("svg").empty()
            tributary.initialize(d3.select("svg"))

        return true


    #TODO: move this to view?
    newcode: (code) =>
        #save the code in the model
        @set({code:code})

        @execute()
        #TODO: store code in local storage

        return true

    get_code: (callback) =>
        if(@get("gist") && @get("filename"))
            src_url = "/tributary/api/" + @get("gist")  + "/" + @get("filename")
            d3.text(src_url, (data) =>
                #if(!data)
                #   data=""
                if(data)
                    code = data
                    @set({code: data})
                else
                    code = @get("code")
                    console.log("codeee?", code)
                    if(!code)
                        code = ""
                #TODO: add error checking
                #callback(null, data)
                callback(null, code)
            )

class tributary.Reptile extends tributary.Tributary
    ###
    #   For making tiles with tributary code
    ###
    initialize: ->
        super
        @set({code: """g.append("rect").attr("width", 100).attr("height", 100)"""})
        @
        
    execute: () =>
        #empty the svg object
        #$("svg").empty()
        delete tributary.initialize
        #run the code
        try
            #tributary.make_clones() 
            #svg = d3.select("svg")
            #eval(@get("code"))
            #wrap the code in a closure
            code = "tributary.initialize = function(g) {"
            code += @get("code")
            code += "};"
            eval(code)
            $('#clones').empty()
            #tributary.initialize(d3.select("svg"))
            tributary.make_clones()
            tributary.layout()
            @trigger("noerror")
        catch e
            @trigger("error",e)
        return true



class tributary.Delta extends tributary.Tributary
    ###
    #   For exploring transitions
    ###

    execute: () =>
        try
            svg = d3.select(".tributary_svg")
            eval(@get("code"))
            @trigger("noerror")
        catch e
            @trigger("error", e)


        if(tributary.bv)
            #d3.selectAll(".bvclone").remove(); 
            try
                $('#clones').empty()
                tributary.make_clones()

        try
            $("#delta").empty()
            #we exec the user defined append code
            tributary.init(tributary.g)
            #then we run the user defined run function
            #tributary.run(tributary.t, tributary.g)
            tributary.execute()
        catch e
            @trigger("error", e)

        return true

class tributary.Flow extends tributary.Tributary
    ###
    #   Music visualization exploration
    ###

    execute: () =>
        try
            eval(@get("code"))
            @trigger("noerror")
        catch e
            @trigger("error", e)

        try
            $("#flow").empty()
            #we exec the user defined append code
            tributary.init(tributary.g)
            #then we run the user defined run function
            tributary.execute()
            @trigger("noerror")
        catch e
            @trigger("error", e)

        return true

class tributary.Geyser extends tributary.Tributary
    ###
    #   Music visualization with controls for mapping frequencies to viz params
    ###


    execute: () =>
        #empty the svg object
        $("#geyser").empty()
        #run the code
        try
            svg = d3.select("#geyser")
            eval(@get("code"))
        try
            #we exec the user defined append code
            tributary.init(tributary.g)
        try
            #then we run the user defined run function
            tributary.execute()

        return true

class tributary.Fountain extends tributary.Tributary
    ###
    #   Music visualization with MIDI controls for mapping frequencies to viz params
    ###


    execute: () =>
        #empty the svg object
        $("#fountain").empty()
        #run the code
        try
            svg = d3.select("#fountain")
            eval(@get("code"))
        try
            #we exec the user defined append code
            tributary.init(tributary.g)
        try
            #then we run the user defined run function
            tributary.execute()

        return true



class tributary.TributaryView extends Backbone.View
    check_date: true
    initialize: ->
        @endpoint = @options.endpoint || "tributary"
        #TODO: this should all be in render() 
        #but we assume that the #editor div is present when this class is
        #instanciated. move it once the code is on more solid ground
        #@aceEditor = @model.aceEditor
        @chosenRow = 0
        @chosenColumn = 0
        @onNumeric = false


        #why do we have these here? idk, should only have 1 if anything
        #but can't be certain the clicks are going through
        #it seems cursor activity can trigger before these clicks do
        d3.select("#editor").on("click", () =>
            #@editor_click()
            @sliding = false
            @picking = false
        )
        d3.select(".CodeMirror").on("click", () =>
            #@editor_click()
            @sliding = false
            @picking = false
        )



        @code_editor = CodeMirror(d3.select("#editor").node(), {
            #value: "function myScript(){return 100;}\n",
            mode:  "javascript",
            theme: "lesser-dark",
            lineNumbers: true,
            onChange: () =>
                thisCode = @code_editor.getValue()
                @model.trigger("code", thisCode)
            })
        @inlet = Inlet(@code_editor)


        #@editor_click
       
        #setup functions
        #@init_slider()
        #@init_picker()
        @init_gui()
        
        if @model.get("code")?
            @code_editor.setValue(@model.get("code"))
            #@model.trigger("code", @model.get("code"))
            @model.execute()

        #fill in the editor with text we get back from the gist
        #console.log(@get("gist"), @get("filename"))
        @model.get_code((error, code) =>
            @code_editor.setValue(code)
        )

        #Hook up drag and drop for code file
        $('body')[0].addEventListener('dragover', @_dragOver, false)
        $('body')[0].addEventListener('drop', @_fileDrop, false)

        #Setup loop to check for file date
        @code_last_modified = new Date(0,0,0)
        @past = new Date()
        d3.timer(()=>
            if new Date() - @past > 300
                if @file?
                    @_loadFile()
                @past = new Date()
            return false
        )

        @

    init_gui: =>
        #Setup the gui elements for this page

        #Setup tweet link
        #var thisurl = window.location.protocol + "//" + window.location.host + "/" + window.location.pathname;
        $('#tweet_this').append("tweet this")
        $('#tweetPanel').on("click", (e) =>
            @save_gist((newurl, newgist) ->
                tweetlink = "http://twitter.com/home/?status=See my latest %23tributary here "+"http://enjalot.com" + newurl
                window.location = tweetlink
                #window.open(tweetlink, 'twitte')
            )
        )

        #Setup the save panel
        $('#savePanel').on('click', (e) =>
            @save_gist((newurl, newgist) ->
                window.location = newurl
            )
        )

        #Setup editor controls
        @editor_width = 600
        @editor_height = 300
        editor = $('#editor')
        editor.css('width', @editor_width)
        editor.css('height', @editor_height)
        
        editor_drag = d3.behavior.drag()
            .on("drag", (d,i) =>
                dx = d3.event.dx
                dy = d3.event.dy
                d.x -= dx
                d.y -= dy
                @editor_handle.style("bottom", @editor_height + d.y + "px")
                @editor_handle.style("right", -10 + @editor_width + d.x + "px")

                editor.css('width', @editor_width + d.x + "px")
                editor.css('height', @editor_height + d.y + "px")
                editor.find('.CodeMirror-scroll').css('height', @editor_height + d.y + "px")
                editor.find('.CodeMirror-gutter').css('height', @editor_height + d.y + "px")
 
            )

            
        handle_data = {
            x: 0
            y: 0
        }
        #d3.select("#editor").append("div")
        #TODO: make this not append to body, but @el (need @el)
        @editor_handle = d3.select("body").append("div")
            .attr("id", "editor_handle")
            .data([handle_data])
            .style("position", "fixed")
            .style("display", "block")
            .style("float", "left")
            .style("bottom", @editor_height + "px")
            .style("right", -11 + @editor_width + "px")
            .style("width", "20px")
            .style("height", "20px")
            .style("background-color", "rgba(50, 50, 50, .4)")
            .style("z-index", 999)
            .call(editor_drag)

        @model.on("error", () =>
            @editor_handle.style("background-color", "rgba(250, 50, 50, .7)")
        )
        @model.on("noerror", () =>
            @editor_handle.style("background-color", "rgba(50, 250, 50, .4)")
        )

        #Setup Hide the editor button
        he = $('#hideEditor')
        he.on("click", (e) ->
            $("#editor").toggle()
            $("#editor_handle").toggle()
            #toggle the gui for delta/flow
            #$('#gui').toggle()
            txt = he.html()
            #console.log("txt", txt)
            if(txt == "Hide")
                he.html("Show")
                #$('#slider').css('visibility', 'hidden')
                #$('#ColorPicker').css('display', 'none')
            else
                he.html("Hide")
                #hide the slider if it's open
        )

    
    save_gist: (callback) =>
        #console.log("ENDPOINT", @endpoint)
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
        $.post('/tributary/save', {"gist":JSON.stringify(gist)}, (data) =>
            #TODO: fix the flask headers to send back application/json and not text/html
            if(typeof(data) == "string")
                data = JSON.parse(data)
            newgist = data.id
            newurl = "/" + @endpoint + "/" + newgist + "/" + filename
            #console.log("new url", newurl)
            callback(newurl, newgist)
            #window.location = newurl;
        )

    #------------------------------------
    #Drop file functions
    #------------------------------------

    _dragOver: (ev)=>
        '''Called when a user drags a file over the #drop_file div'''
        ev.stopPropagation()
        ev.preventDefault()
        ev.dataTransfer.dropEffect = 'copy'
        #$('#drop_file').addClass('drop_file_active')

    _fileDrop: (ev)=>
        ev.stopPropagation()
        ev.preventDefault()
        @file = ev.dataTransfer.files[0]
        @code_last_modified = new Date(0,0,0)
        @_loadFile()

    _loadFile: ()=>
        reader = new FileReader()
        # register an onload callback that gets fired after the reader has finished reading the file
        if not @check_date or @file.lastModifiedDate > @code_last_modified
            console.log("read file!")
            reader.onload = ()=>
                #@executeCode({reader: reader})
                @code_editor.setValue(reader.result)
            @code_last_modified = @file.lastModifiedDate

            reader.readAsText(@file)


class tributary.GeyserView extends Backbone.View
    initialize: ->
        @
    render: =>
        #draw the 16 pads
        #Generate pads for geyser
        #TODO: use a backbone collection and don't embed all the logic in the elements
        
        padn = 16   #16 pads
        xn = 4      #4 in the x direction
        yn = 4      #4 in the y direction
        spacing = 10
        pad_data = d3.range(padn)

        geyserpad = d3.select("#geyserpad")

        padgw = parseInt(geyserpad.style("width"))
        padgh = parseInt(geyserpad.style("height"))
        padw = (padgw - spacing*xn)/xn
        padh = (padgh - spacing*yn)/yn

        keys = ['4','5','6','7','r','t','y','u','f','g','h','j','v','b','n','m']

        padsg = geyserpad.append("g").attr("id", "geyserpads")
        pads = padsg.selectAll("rect.geyserpad")
            .data(pad_data)
            .enter()
            .append("rect")
            .attr("class", "geyserpad")
            .attr("width", padw)
            .attr("height", padh)
            .attr("fill", "#000000")
            .attr("stroke", "#000000")
            .attr("stroke-width", 3)
            .style("opacity", 0.3)
            .attr("stroke-opacity", 1)
            .attr("transform", (d,i)=>
                x = i % xn * (padw + spacing) + spacing/2
                y = parseInt(i / yn) * (padh + spacing) + spacing/2
                return "translate(" + [x, y]  + ")"
            )
            .on("click", ()->
                #d3.select(@)
            )
            .on("mousedown", (d,i)->
                d3.select(@).attr("fill", "#ffff00")
                tributary.pads[i].start()
            )
            .on("mouseup", (d,i)->
                d3.select(@).attr("fill", "#000")
                tributary.pads[i].stop()
            )
            .each((d,i) ->
                $('body').bind('keydown', jwerty.event(keys[d], ()=>
                    tributary.pads[d].start()
                    d3.select(@).attr("fill", "#ffff00")
                ))
                $('body').bind('keyup', jwerty.event(keys[d], ()=>
                    tributary.pads[d].stop()
                    d3.select(@).attr("fill", "#000")
                ))
            )

        #$(@).bind('keydown', jwerty.event('caps-lock+4', ()->
        _.each(pad_data, (d) ->
            $('body').bind('keydown', jwerty.event(keys[d], ()->
                tributary.pads[d].start()
                d3.select(@).attr("fill", "#ffff00")
            ))
            $('body').bind('keyup', jwerty.event(keys[d], ()->
                tributary.pads[d].stop()
            ))
        )
           

        @
 
class tributary.FountainView extends Backbone.View
    initialize: ->
        @
    render: =>
        #draw the 16 pads
        #Generate pads for fountain
        #TODO: use a backbone collection and don't embed all the logic in the elements
        
        padn = 16   #16 pads
        xn = 4      #4 in the x direction
        yn = 4      #4 in the y direction
        spacing = 10
        pad_data = d3.range(padn)

        fountainpad = d3.select("#fountainpad")

        padgw = parseInt(fountainpad.style("width"))
        padgh = parseInt(fountainpad.style("height"))
        padw = (padgw - spacing*xn)/xn
        padh = (padgh - spacing*yn)/yn

        keys = ['4','5','6','7','r','t','y','u','f','g','h','j','v','b','n','m']

        padsg = fountainpad.append("g").attr("id", "fountainpads")
        pads = padsg.selectAll("rect.fountainpad")
            .data(pad_data)
            .enter()
            .append("rect")
            .attr("class", "fountainpad")
            .attr("width", padw)
            .attr("height", padh)
            .attr("fill", "#000000")
            .attr("stroke", "#000000")
            .attr("stroke-width", 3)
            .style("opacity", 0.3)
            .attr("stroke-opacity", 1)
            .attr("transform", (d,i)=>
                x = i % xn * (padw + spacing) + spacing/2
                y = parseInt(i / yn) * (padh + spacing) + spacing/2
                return "translate(" + [x, y]  + ")"
            )
            .on("click", ()->
                #d3.select(@)
            )
            .on("mousedown", (d,i)->
                d3.select(@).attr("fill", "#ffff00")
                tributary.pads[i].start()
            )
            .on("mouseup", (d,i)->
                d3.select(@).attr("fill", "#000")
                tributary.pads[i].stop()
            )
            .each((d,i) ->
                $('body').bind('keydown', jwerty.event(keys[d], ()=>
                    tributary.pads[d].start()
                    d3.select(@).attr("fill", "#ffff00")
                ))
                $('body').bind('keyup', jwerty.event(keys[d], ()=>
                    tributary.pads[d].stop()
                    d3.select(@).attr("fill", "#000")
                ))
            )

        #$(@).bind('keydown', jwerty.event('caps-lock+4', ()->
        _.each(pad_data, (d) ->
            $('body').bind('keydown', jwerty.event(keys[d], ()->
                tributary.pads[d].start()
                d3.select(@).attr("fill", "#ffff00")
            ))
            $('body').bind('keyup', jwerty.event(keys[d], ()->
                tributary.pads[d].stop()
            ))
        )
           

        @
 

