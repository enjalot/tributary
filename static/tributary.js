tributary.Tributary = Backbone.Model.extend({
    defaults: {
        code: "",
        coffee: false
    },
    binder: function() {
        this.on("code", this.newcode);
        this.on("execute", this.execute);
        this.on("error", this.handle_error);
    },
    initialize: function() {
        this.binder();
    },
    handle_error: function(e) {
        if(tributary.trace) {
            console.log(e);
            console.trace();
        }
    },
    handle_coffee: function() {
        //This checks if coffeescript is being used
        //and returns compiled javascript
        var js = this.get("code");
        if(this.get("coffee")) {
            //compile the coffee
            js = CoffeeScript.compile(js, {"bare":true});
        }
        return js;
    },
    execute: function() {   
        var js = this.handle_coffee();
        try {
            svg = d3.select("svg");
            //wrap the code in a closure
            var code = "tributary.initialize = function(g) {";
            code += js;
            code += "};";
            eval(code);
            //trib = window.trib  #access global trib object
            //trib_options = window.trib_options  #access global trib object
            //tributary.initialize(d3.select("svg.tributary_svg"))
        } catch (e) {
            this.trigger("error", e);
            return false;
        }
        
        //we don't want it to nuke the svg if there is an error
        try {
            //for the datGUI stuff
            window.trib = {};               //reset global trib object
            window.trib_options = {};       //reset global trib_options object
            trib = window.trib;
            trib_options = window.trib_options;
            $("svg.tributary_svg").empty();
            tributary.initialize(d3.select("svg.tributary_svg"));
        } catch (er) {
            this.trigger("error", er);
            return false;
        }
        this.trigger("noerror");

        return true;
    },
    newcode: function(code) {
        //save the code in the model
        this.set({code:code});
        this.execute();
        //TODO: store code in local storage

        return true;
    },
    get_code: function(callback) {
        var that = this;
        //if(this.get("gist") && this.get("filename")) {
        if(this.get("gist")) {
            var filename = this.get("filename");
            if(filename) {
                src_url = "/tributary/api/" + this.get("gist")  + "/" + this.get("filename");
            } else {
                src_url = "/tributary/api/" + this.get("gist");
            }
            d3.text(src_url, function(data) { 
                if(data) {
                    code = data;
                    that.set({code: data});
                } else {
                    code = that.get("code");
                    if(!code) {
                        code = "";
                    }
                }
                //TODO: add error checking
                callback(null, code);
            });
        }
    }

});

tributary.TributaryView = Backbone.View.extend({
    check_date: true,
    initialize: function() {
        this.endpoint = this.options.endpoint || "tributary";
        //TODO: this should all be in render() 
        //but we assume that the #editor div is present when this class is
        //instanciated. move it once the code is on more solid ground

        //we will be using "that" a lot. it would have been fun to use "dat" instead.
        var that = this;

        d3.select("#editor").on("click", function() {
            that.sliding = false;
            that.picking = false;
        });
        d3.select(".CodeMirror").on("click", function() {
            that.sliding = false;
            that.picking = false;
        });

        this.code_editor = CodeMirror(d3.select("#editor").node(), {
            //value: "function myScript(){return 100;}\n",
            mode:  "javascript",
            theme: "lesser-dark",
            lineNumbers: true,
            onChange: function() {
                thisCode = that.code_editor.getValue();
                that.model.trigger("code", thisCode);
            }
        });

        //datgui things 
        this.controls = {};
        //keep track of whether or not datGui is being used
        this.dating = false;
        this.gui = new dat.GUI();

        this.make_ui = function() {
            //we only need to remake the ui if we are not using it
            if(!that.dating) {
                //reset everything
                that.gui.destroy();
                that.gui = new dat.GUI();
                var key;
                _.each(_.keys(trib), function(key) {
                    if(that.controls[key] !== undefined) {
                        delete that.controls[key];
                    }
                    //console.log key, trib[key]

                    if(trib_options !== undefined && trib_options[key] !== undefined) {
                        that.controls[key] = that.gui.add(trib, key, trib_options[key].min, trib_options[key].max);
                    } else {
                        //automatically make the range for the slider since its not provided
                        val = trib[key];
                        if(typeof(val) === "number") {
                            var min, max, slider_min, slider_max;
                            if(val === 0) {
                                min = -100;
                                max = 100;
                            } else {
                                min = -10 * val;
                                max = 10 * val;
                                slider_min = _.min([min, max]);
                                slider_max = _.max([min, max]);
                            }
                            that.controls[key] = that.gui.add(trib, key, slider_min, slider_max);
                        }
                    }

                    that.controls[key].onChange(function(key) {
                        return function(value) {
                            //console.log("args", arguments)
                            that.dating = true;
                            //search for this in the code and replace
                            //number regex taken from d3 source
                            //var txt = new RegExp("trib\." + key + "\\s*=(\\s*)[-+]?(?:\\d+\\.?\\d*|\\.?\\d+)(?:[eE][-+]?\\d+)?");
                            var txt = new RegExp("trib." + key + "\\s*=(\\s*)[-+]?(?:\\d+\\.?\\d*|\\.?\\d+)(?:[eE][-+]?\\d+)?");
                            //console.log("TXT", txt)
                            var cursor = that.code_editor.getSearchCursor(txt);
                            if(cursor.findNext()) {
                                var newtxt = "trib." + key + " = " + value;
                                cursor.replace(newtxt);
                            }
                        };
                    }(key));
                });
            }
        };
            
        this.inlet = Inlet(this.code_editor);

        this.init_gui();
        
        var code = this.model.get("code");
        //check if we already have the code
        if(code !== undefined && code !== "") {
            this.code_editor.setValue(code);
            this.model.execute();
        }// else {
        //fill in the editor with text we get back from the gist
        this.model.get_code(function(error, got_code) {
            that.code_editor.setValue(got_code);
        });

        //Hook up drag and drop for code file
        $('body')[0].addEventListener('dragover', this._dragOver, false);
        $('body')[0].addEventListener('drop', this._fileDrop, false);

        //Setup loop to check for file date
        this.code_last_modified = new Date(0,0,0);
        this.past = new Date();
        d3.timer(function() {
            if(new Date() - that.past > 300) {
                if(that.file !== undefined) {
                    that._loadFile();
                }
                that.past = new Date();
            }
            return false;
        });
    },
    init_gui: function() {
        var that = this;
        //Setup the gui elements for this page
        //Setup tweet link
        /*
        $('#tweet_this').append("tweet this");
        $('#tweetPanel').on("click", function(e) {
            that.save_gist(function(newurl, newgist) {
                var tweetlink = "http://twitter.com/home/?status=See my latest %23tributary here "+"http://mainstem.org" + newurl;
                window.location = tweetlink;
                //window.open(tweetlink, 'twitte')
            });
        });
        */

        //Setup the save panel
        $('#savePanel').on('click', function(e) {
            that.save_gist(function(newurl, newgist) {
                window.location = newurl;
            });
        });
        //Setup the login button
        $('#loginPanel').on('click', function(e) {
            //TODO: use next parameter to redirect
            if(tributary.loggedin) {
                window.location = "/github-logout";
            } else {
                window.location = "/github-login";
            }
        });

    
        //setup ui related to the gist
        $.get('https://api.github.com/gists/' + this.model.get("gist"), function(data) {
            //console.log("GIST!", data);
            if(data.user === null || data.user === undefined) {
                data.user = {
                    login: "anon",
                    url: "",
                    userid: -1
                };
            }
            var gist_uid = data.user.userid;
            /* TODO: setup editing of description as well as a save button
            if(gist_uid === tributary.userid) {
                //the loggedin user owns this gist
            }
            */
            //make the description and attribution
            var info_string = '"<a href="' + data.html_url + '">' + data.description + '</a>" by ';
            if(data.user.url === "") {
                info_string += data.user.login;
            } else {
                info_string += '<a href="' + data.user.url + '">' + data.user.login + '</a>';
            }

            $('#gist_info').html(info_string);

        });


        //Setup editor controls
        this.editor_width = 600;
        this.editor_height = 300;
        var editor = $('#editor');
        editor.css('width', this.editor_width);
        editor.css('height', this.editor_height);
        
        var editor_drag = d3.behavior.drag()
            .on("drag", function(d,i) {
                var dx = d3.event.dx;
                var dy = d3.event.dy;
                d.x -= dx;
                d.y -= dy;
                that.editor_handle.style("bottom", -10 + that.editor_height + d.y + "px");
                that.editor_handle.style("right", -10 + that.editor_width + d.x + "px");

                editor.css('width', that.editor_width + d.x + "px");
                editor.css('height', that.editor_height + d.y + "px");
                editor.find('.CodeMirror-scroll').css('height', that.editor_height + d.y + "px");
                editor.find('.CodeMirror-gutter').css('height', that.editor_height + d.y + "px");
            });
   
        var handle_data = {
            x: 0,
            y: 0
        };
        //d3.select("#editor").append("div")
        //TODO: make this not append to body, but @el (need @el)
        this.editor_handle = d3.select("body").append("div")
            .attr("id", "editor_handle")
            .data([handle_data])
            .style("position", "fixed")
            .style("display", "block")
            .style("float", "left")
            .style("bottom", -11 + this.editor_height + "px")
            .style("right", -11 + this.editor_width + "px")
            .style("width", "20px")
            .style("height", "20px")
            .style("background-color", "rgba(50, 50, 50, .4)")
            .style("z-index", 999)
            .call(editor_drag);

        this.model.on("error", function() {
            that.editor_handle.style("background-color", "rgba(250, 50, 50, .7)");
        });
        this.model.on("noerror", function() {
            that.editor_handle.style("background-color", "rgba(50, 250, 50, .4)");
            that.make_ui();
            that.dating = false;
        });

        //Setup Hide the editor button
        var he = $('#hideEditor');
        he.on("click", function(e) {
            $("#editor").toggle();
            $("#editor_handle").toggle();
            //toggle the gui for delta/flow
            //$('#gui').toggle()
            var txt = he.html();
            //console.log("txt", txt)
            if(txt === "Hide") {
                he.html("Show");
            } else {
                he.html("Hide");
            }
        });

        //setup the coffeescript checkbox
        var cs = $('#coffee_check');
        cs.on("change", function(e) {
            var coffee_on = cs.is(":checked");
            that.model.set({"coffee": coffee_on});

            if(coffee_on) {
                that.code_editor.setOption("mode", "coffeescript");
            } else {
                that.code_editor.setOption("mode", "javascript");
            }
            that.model.execute();
        });
    },
    save_gist: function(callback) {
        //console.log("ENDPOINT", @endpoint)
        //Save the current code to a public gist
        var oldgist = parseInt(this.model.get("gist"), 10);

        //We now assume all tributaries will be saved as inlet.js
        //so this code is a bit redundant, but it might be useful in the future
        //filename = this.model.get("filename");
        //if(filename === ""){
        filename = "inlet.js";
        //}
        var gist = {
            description: 'just another inlet to tributary',
            public: true,
            files: {}
        };
        gist.files[filename] = {
            content: this.model.get("code")
        };

        //turn the save button into a saving animation
        d3.select("#saveButton").style("background-image", "url(/static/img/ajax-loader.gif)");
        d3.select("#saveButton").style("background-repeat", "no-repeat");
        d3.select("#saveButton").style("top", "0px");
        
        var that = this;
        $.post('/tributary/save', {"gist":JSON.stringify(gist)}, function(data) {
            if(typeof(data) === "string") {
                data = JSON.parse(data);
            }
            var newgist = data.id;
            var newurl = "/" + that.endpoint + "/" + newgist;// + "/" + filename;
            callback(newurl, newgist);
            //window.location = newurl;
        });
    },

    //------------------------------------
    //Drop file functions
    //------------------------------------

    _dragOver: function(ev) {
        //Called when a user drags a file over the #drop_file div
        ev.stopPropagation();
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'copy';
        //$('#drop_file').addClass('drop_file_active');
    },
    _fileDrop: function(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        this.file = ev.dataTransfer.files[0];
        this.code_last_modified = new Date(0,0,0);
        this._loadFile();
    },
    _loadFile: function() {
        var that = this;
        var reader = new FileReader();
        // register an onload callback that gets fired after the reader has finished reading the file
        if(!this.check_date || this.file.lastModifiedDate > this.code_last_modified) {
            console.log("read file!");
            reader.onload = function() {
                //@executeCode({reader: reader})
                that.code_editor.setValue(reader.result);
            };
            this.code_last_modified = this.file.lastModifiedDate;
            reader.readAsText(this.file);
        }
    }
});


