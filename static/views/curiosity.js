tributary.Curiosity = Backbone.Model.extend({
    defaults: {
        code: "",
        coffee: false,
        filename: "inlet.js"
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
            
            //wrap the code in a closure
            var code = "tributary.initialize = function() {";
            code += js;
            code += "};";
            eval(js);


        } catch (e) {
            this.trigger("error", e);
            return false;
        }
        
        //we don't want it to nuke the svg if there is an error
        try {
            //for the datGUI stuff
            // window.trib = {};               //reset global trib object
            // window.trib_options = {};       //reset global trib_options object
            // trib = window.trib;
            // trib_options = window.trib_options;
            // $("svg.tributary_svg").empty();
            tributary.initialize();
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
    }
});

tributary.CuriosityView = Backbone.View.extend({


});

tributary.CuriosityView = Backbone.View.extend({
    check_date: true,
    initialize: function() {
        this.endpoint = this.options.endpoint || "curiosity";
        //TODO: this should all be in render() 
        //but we assume that the #editor div is present when this class is
        //instanciated. move it once the code is on more solid ground

        //we will be using "that" a lot. it would have been fun to use "dat" instead.
        var that = this;


        //we will manage several editors
        this.editor = {};
        this.editor_handle = {};
        //we keep an array of json models
        this.jsons = [];
    
        /////////////////////////////////////
        //Here we setup all the model stuff
        //really this should go in the initialization... and all the gui should follow
        /////////////////////////
        var cachebust = "?cachebust=" + Math.random() * 4242424242424242;
        if(this.model.get("gist") && this.model.get("gist") !== "None") {
          //setup ui related to the gist
          d3.json('https://api.github.com/gists/' + this.model.get("gist") + cachebust, function(data) {
              //console.log("GIST!", data);
              if(data.user === null || data.user === undefined) {
                  data.user = {
                      login: "anon",
                      url: "",
                      userid: -1
                  };
                  that.loggedin = false;
              } else {
                that.loggedin = true;
              }
              that.gist = data;

              //load markdown files here
              // _.md
              var markdown;
              try {
                markdown = data.files["_.md"];
              } catch (e) {
                markdown = false;
              }
              if(markdown) {
                //console.log("yay! fix the URL", markdown, that.gist, window.location.host)
                try {
                that.markdown = "<br /> [See Previous Inlet](http://" + window.location.host + "/" + that.endpoint + "/" + that.gist.id + ")"
                + " [ [Gist](" + that.gist.html_url + ") ]"

                } catch (e){
                  that.markdown = "Unknown Error Recovering Gist History"
                }
              } else {
                  that.markdown = "No Previous Gist"
              }
  

              //load optional files here
              //config.json
              var config;
              try {
                config = data.files["config.json"];
              } catch (e) {
                config = false;
              }
              if(config) {
                //console.log("yay!", config)
                try {
                  that.config = new tributary.Config(JSON.parse(config.content))
                } catch (e){
                  that.config = new tributary.Config();
                }
              } else {
                that.config = new tributary.Config();
              }
              //
              //json files
              var files = _.keys(data.files);
              //console.log("files", files)
              var fsplit, json, i = 0, jsonid;
              files.forEach(function(f) {
                fsplit = f.split("."); 
                if(fsplit[fsplit.length-1] === "json" && f !== "config.json") {
                  //found us a ripe json file!
                  //setup the JSON model to store it
                  //json = new tributary.JSON({"name":fsplit[0], "code":data.files[f].content})
                  json = new tributary.JSON({"filename":f,"name":fsplit[0], "code":data.files[f].content})
                  //keep track of this json
                  that.jsons.push(json);
  
                  jsonid = "json" + i;
                  //this seems weird that we have to set up the config manually
                  if(!that.config.get("editor_" + jsonid)) {
                    that.config.set("editor_" + jsonid, {
                      vim: that.config.get("editor_editor").vim,
                      emacs: that.config.get("editor_editor").emacs,
                      width: 600,
                      height: 300,
                      hide: false
                    });
                  }

                  that.setup_editor(jsonid, json, {coffee_checkbox: false});
                  json.execute();
                  json.on("noerror", function() {
                    that.model.execute();
                  });
                  i++;
                }
              });


              //set the code
              var code_file = data.files[that.model.get("filename")];
              if(code_file)
              {
                that.model.set("code", code_file.content)
              }

              that.init_gui();
              //for the code we setup special code editor still
              that.code_editor = that.setup_editor("editor", that.model);
              //it hooks up to dat gui


              //yay all done, lets run the code we loaded in
              that.model.execute();
              that.model.trigger("gotcode");

          });
        } else {
          //setup empty config
          that.config = new tributary.Config();
          that.markdown = "No parent Inlet"
          
          that.init_gui();
          that.setup_editor("editor", this.model);
          this.model.execute();
          this.model.trigger("gotcode");
        }


    },
    init_gui: function() {
        var that = this;


        //Setup the save panel
        $('#savePanel').on('click', function(e) {
            d3.select("#syncing").style("display", "block");
            that.save_gist("save", function(newurl, newgist) {
                window.location = newurl;
            });
        });
        $('#forkPanel').on('click', function(e) {
            d3.select("#syncing").style("display", "block");
            that.save_gist("fork", function(newurl, newgist) {
                window.location = newurl;
            });
        });
        //Setup the login button
        $('#loginPanel').on('click', function(e) {
            that.login_gist(tributary.loggedin, function(newurl, newgist) {
                window.location = newurl;
            }); 

        });

        if(this.gist) {
          var gist_uid = this.gist.user.userid;
          /* TODO: setup editing of description as well as a save button
          if(gist_uid === tributary.userid) {
              //the loggedin user owns this gist
          }
          */
          //make the description and attribution
          var info_string = '"<a href="' + this.gist.html_url + '">' + this.gist.description + '</a>" by ';
          if(this.gist.user.url === "") {
              info_string += this.gist.user.login;
          } else {
              info_string += '<a href="' + this.gist.user.url + '">' + this.gist.user.login + '</a>';
          }

          $('#gist_info').html(info_string);

          if(this.gist.user.id !== tributary.userid) {
            $("#savePanel").attr("disabled", "true");
            $("#savePanel").attr("class", "off");
          }
        }
        //if the user is not logged in, disable save
        if(tributary.userid === NaN) {
          $("#savePanel").attr("disabled", "true");
          $("#savePanel").attr("class", "off");
          //$("#forkPanel").attr("disabled", "true");
          //$("#forkPanel").attr("class", "minimal_off");
        }
    },

    setup_editor: function(editor_id, model, options) {
        var that = this;

        if(!options) {
          options = {"coffee_checkbox": true};
        }
       
        //config id, how we reference this editor in the config
        var cid = "editor_" + editor_id;

        //this could probably be done better with templating
        //add the editor element to the page
        var editor_sel = d3.select("#page")
          .append("div")
          .classed("editor", true)
          .attr("id", editor_id);
        var topbar = editor_sel.append("div")
          .classed("editor-topbar", true)

        topbar.append("button")
          .text("Hide")
          .classed("button_on", true)
          .classed("hidebutton", true)

        //some stuff we have to do to make sure we don't get into infinite change loops
        //with slider and color picker
        editor_sel.on("click", function() {
            that.sliding = false;
            that.picking = false;
        });
        editor_sel.select(".CodeMirror").on("click", function() {
            that.sliding = false;
            that.picking = false;
        });

        //CODE SPECIFIC
        var code_editor = CodeMirror(editor_sel.node(), {
            //value: "function myScript(){return 100;}\n",
            mode:  "javascript",
            theme: "lesser-dark",
            lineNumbers: true,
            onChange: function() {
                thisCode = code_editor.getValue();
                model.trigger("code", thisCode);
            }
        });

        this.inlet = Inlet(code_editor);
        var code = model.get("code");
        //check if we already have the code
        if(code !== undefined && code !== "") {
          code_editor.setValue(code);
        }

        /////////////////////////////////////////////////

        //Setup editor controls
        //This is like the windowing system for the code editor
        //the configuration for each editor is stored in the this.editor object
        //which gets saved to the config
        var editor_el = $("#" + editor_id);
        this.editor[editor_id] = this.config.get(cid);
        var editor = this.editor[editor_id];

        editor_el.css('width', editor.width);
        editor_el.css('height', editor.height);
        editor_el.find('.CodeMirror-scroll').css('height', editor.height + "px");
        editor_el.find('.CodeMirror-gutter').css('height', editor.height + "px");

        //we store the current width and height in these variables
        //to be able to calculate the resize position from the original w/h
        var ew = editor.width;
        var eh = editor.height;

        var handle_offset = -25;

        var editor_drag = d3.behavior.drag()
            .on("drag", function(d,i) {
                var dx = d3.event.dx;
                var dy = d3.event.dy;
                d.x -= dx;
                d.y -= dy;
                //don't use latest editor w/h in calculation
                var neww = ew + d.x;
                var newh = eh + d.y;
                editor_handle.style("right", handle_offset + neww + "px");
                editor_handle.style("bottom", handle_offset + newh + "px");

                editor_el.css('width', neww + "px");
                editor_el.css('height', newh + "px");
                editor_el.find('.CodeMirror-scroll').css('height', newh + "px");
                editor_el.find('.CodeMirror-gutter').css('height', newh + "px");
                
                //we store the width height only for future config use
                editor.width = neww;
                editor.height = newh;

                that.config.set(cid, editor);
            });
   
        var handle_data = {
            x: 0,
            y: 0
        };

        //TODO: update editor handle
        //this editor handle is both indicator and drags around the editor
        //should make the draggin part be something invisible over the gutter (line numbers)
        //and have the indicator somewhere else
        this.editor_handle[editor_id] = d3.select("body").append("div")
            .attr("id", "editor_handle_" + editor_id)
            .data([handle_data])
            .style("position", "fixed")
            .style("display", "block")
            .style("float", "left")
            .style("bottom", handle_offset + editor.height + "px")
            .style("right", handle_offset + editor.width + "px")
            .style("width", "20px")
            .style("height", "20px")
            .style("background-color", "rgba(50, 50, 50, .4)")
            .style("z-index", 999)
            .call(editor_drag);
        var editor_handle = this.editor_handle[editor_id];

        model.on("error", function() {
            editor_handle.style("background-color", "rgba(250, 50, 50, .7)");
        });
        model.on("noerror", function() {
            editor_handle.style("background-color", "rgba(50, 250, 50, .4)");
            
        });

        //Setup Hide the editor button
        var h_id = "hideEditor_" + editor_id
        //setup hide button
        var he = topbar.select(".hidebutton");
        //setup show button
        d3.select("#hideEditors").append("div").attr("id", h_id)
          .classed("show_editor", true)
          .text("Show " + model.get("filename"));

        var se = $('#' + h_id);

        var hide = editor.hide;
        showhide();


        
        function showhide() {
            editor_el.toggle(!hide);
            $("#editor_handle_" + editor_id).toggle(!hide);
            se.toggle(hide);

            /*
            if(hide) {
                he.html("Show");
            } else {
                he.html("Hide");
            }
            */
        }
        
        he.on("click", function(e) {
            hide = !hide;
            editor.hide = hide;
            that.config.set(cid, editor);
            showhide();
        });
        se.on("click", function(e) {
            hide = !hide;
            editor.hide = hide;
            that.config.set(cid, editor);
            showhide();
        });


       return code_editor;

    },
    save_gist: function(saveorfork, callback) {
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

        this.jsons.forEach(function(j) {
          //gist.files[j.get("name") + ".json"] = {
          gist.files[j.get("filename")] = {
            content: j.get("code")
          };
        });

        //save config
        gist.files["config.json"] = {
          content: JSON.stringify(this.config.toJSON())
        };

        //save markdown
        gist.files["_.md"] = {
            content: this.markdown
        };


       

        var url;
        if(saveorfork === "save") {
          d3.select("#savePanel img").attr("src", "/static/img/ajax-loader.gif");

          url = '/tributary/save';

        } else if(saveorfork === "fork") {

          d3.select("#forkPanel img").attr("src", "/static/img/ajax-loader.gif");

          url = '/tributary/fork';
 
        }

        //check if we have an existing gist number
        if(oldgist > 0) {
          url += '/' + oldgist;
        }
    
        var that = this;
        $.post(url, {"gist":JSON.stringify(gist)}, function(data) {
            if(typeof(data) === "string") {
              //console.log("SUP", data)
                data = JSON.parse(data);
            }
            var newgist = data.id;
            var newurl = "/" + that.endpoint + "/" + newgist;// + "/" + filename;
            callback(newurl, newgist);
            //window.location = newurl;
        });
    }, 
    login_gist: function(loginorout, callback) {

        var url;
        if(loginorout) {
       
          url = '/github-logout';

        } else {

        
          url = '/github-login';
 
        }
        url+= '/' + this.endpoint
        if (this.gist)
            if (this.gist.id)
                url+= '/' + this.gist.id

        //console.log(loginorout)
        //console.log("url", url)

        var that = this;
        window.location = url

    }
});






