(function(){
  //Get a reference to our iframe window so we can postMessage to it
  var sandbox = d3.select("#sandbox").node().contentWindow;

  var _origin = header.origin;
  
  //these "globals" are modified by the save/fork buttons and referenced
  //when we recieve a save request
  var salt;
  var saveType;
  var saveCallback;

  //pass in gist data
  function load(error, data) {
    //query comes from the request query and is passed to the template as a JSON string
    //sandbox.postMessage({request: "load", gist: data, query: header.query}, _origin);
  }
  d3.select("#sandbox").node().onload = function() {
    sandbox.postMessage({request: "load", gistid: header.gistid, query: header.query}, _origin);
  }

  //Config object has everything we need to save our gist
  function getConfig() {
    salt = +new Date() + Math.random() * 99999999;
    //we pass in salt
    sandbox.postMessage({request: "save", salt:salt}, _origin);
  }
  //tell the iframe what our new description is so it can keep track of it in config
  function setDescription(value) {
    sandbox.postMessage({request: "description", description: value }, _origin)
  }
  function exitFullscreen() {
    sandbox.postMessage({request: "exitfullscreen" }, _origin)
  }
  function setThumbnail(image) {
    sandbox.postMessage({request: "thumbnail", image: image}, _origin);
  }

  //on the load of the iframe, we want to get the gist (if any)
  //and then give it what it needs to fill out
  d3.select("#sandbox").on("load", function() {
    load();
    if(header.gistid !== "" && header.gistid) {
      getGist(header.gistid, function(err) { if(err) console.log("err", err) });
    } else {
      //this sets up the ui even tho we have no gist;
      handle_gist();
    }
  })

  window.addEventListener("message", recieveMessage, false)
  function recieveMessage(event) {
    if(event.origin !== _origin || !event.data) return;
    var data = event.data;

    if(data.request === "save") {
      //make sure this save message was initiated by the user
      if(data.salt !== salt) return
      config = data.config;
      save(config, saveType, saveCallback)

    } else if( data.request === "warnchanged" ) {
      //user has modified code, so we want to warn them before leaving page
      if(!window.onbeforeunload) {
        $(window).on('beforeunload', function() {
            return 'Are you sure you want to leave?';
        });
      }
    } else if( data.request === "fullscreen" ) {
      $("#container").addClass("fullscreen")
      $("#exit-fullscreen").show();
    } else if( data.request === "imgur" ) {
      imgur(data.img);
    }
  }

  $("#exit-fullscreen").on("click", function(){
    $("#exit-fullscreen").hide();
    $("#container").removeClass("fullscreen")
    exitFullscreen();
  })

  //get the gist
  function getGist(id, callback) {
    //return object
    var ret = {};
    var cachebust = "?cachebust=" + Math.random() * 4242424242424242;
    var url = 'https://api.github.com/gists/' + id + cachebust;
    $.ajax({
      url: url,
      contentType: 'application/json',
      dataType: 'json',
      success: function(data) { handle_gist(data, callback) },
      error: function(e) {
        console.log("err", e)
        //if a 403 error (because of rate limiting) 
        url = "/gist/" + id + cachebust;
        $.ajax({
          url: url,
          contentType: 'application/json',
          dataType: 'json',
          success: function(data) { handle_gist(data, callback) },
          error: function(er) {
            console.log("err", er)
            //OH NOES
            callback(er, null);
          }
        })
      },
    })
  }

  //callback when we get gist back, initiate setup of header and save panels
  function handle_gist(data, callback) {
    //get user information or set to anon if none.
    var user;
    var anon = {
        login: "anon",
        url: "",
        userid: -1
      };
    if(!data) {
      //user = anon;
      setup_header(user);
      setup_save(user, !!data);
    } else {
      if(data.user === null || data.user === undefined) {
        user = anon;
      } else {
        user = data.user;
      }

      setup_header(user, data.description);
      setup_save(user, !!data);
      
      //send the data to the child frame
      callback(null, data);
    }
  }

  function setup_header(gistUser, description) {
    if(gistUser) {
      //old user page 5088240
      var profileUrl = "http://tributary.io/inlet/5860371?user=" + gistUser.login;
      $("#inlet-author").html('<a target="_blank" href="' + profileUrl + '">' + gistUser.login + "</a>")
      $("#gist-title").val(description)

      $("#author-avatar img").attr("src", function(d){
        return "http://2.gravatar.com/avatar/"+gistUser.gravatar_id
      })

      d3.select("title").text("Tributary | " + (description || "Inlet"))
    }

    $("#gist-title").on("keyup", function(){
      //console.log($("#gist-title").val());
      d3.select("title").text($("#gist-title").val())
      setDescription($("#gist-title").val())
    })
  }

  function setup_save(gistUser, isGist) {
    if(gistUser) {
      if(gistUser.id !== header.userid) {
        $('#fork').css("display", "none");
        saveType = "fork";
      } else {
        $('#fork').css("display", "");
        saveType = "save";
      }
    } else {
      //if the user is not logged in, or no gist we use fork
      if(isNaN(header.userid) || !isGist) {
        $('#fork').css("display", "none");
        saveType = "fork";
      } else {
        saveType = "save";
      }
    }

    //Setup the save panel
    $('#save').off("click");
    $('#save').on('click', function(e) {
      console.log("saving!")
      d3.select("#syncing").style("display", "block");
      getConfig();
      saveCallback = function(newurl, newgist) {
        console.log("saved!")
        d3.select(".icon-load").transition().duration(1000).style("opacity", 0)
        if(saveType === "fork") {
          window.onunload = false;
          window.onbeforeunload = false;
          if(newurl) {
            //TODO: better error notifying
            window.location = newurl;
          }
        }
      }
    });
    $('#fork').off("click");
    $('#fork').on('click', function(e) {
      console.log("forking!")
      saveType = "fork";
      d3.select(".icon-load").style("opacity", 1);
      getConfig();
      saveCallback = function(newurl, newgist) {
        window.onunload = false;
        window.onbeforeunload = false;
        if(newurl) {
          //TODO: better error notifying
          window.location = newurl;
        }
      }
    });
    //Setup the login button
    $('#loginPanel').on('click', function(e) {
      login_gist(header.loggedin, function(newurl, newgist) {
        window.onunload = false;
        window.onbeforeunload = false;
        window.location = newurl;
      });
    });
  }


  function login_gist(loginorout, callback) {
    if(loginorout) {
      url = '/github-logout';
    } else {
      url = '/github-login';
    }
    url += '/inlet';
    if (header.gistid) {
      url+= '/' + header.gistid;
    }
    //window.location = url
    callback(url);
  };

  function save(gist, saveorfork, callback) {
    var oldgist = header.gistid || ""; 

    var url;
    if(saveorfork === "fork") {
      url = '/tributary/fork';
    } else {
      url = '/tributary/save';
    }

    //check if we have an existing gist number
    if(oldgist.length > 4) {
      url += '/' + oldgist;
    }

    var that = this;
    $.post(url, {"gist":JSON.stringify(gist)}, function(data) {
        if(typeof(data) === "string") {
          data = JSON.parse(data);
        }
        //TODO: add in error checking
        var newgist = data.id;
        var newurl = "/inlet/" + newgist;
        callback(newurl, newgist);
    });
  };

  function imgur(img) {
    $.post("/imgur/upload/thumbnail", {"image":img}, function(image) {
      //console.log("response", image);
      if(image.status === 200) {
        setThumbnail(image);
      } else {
        //oops
      }
    })
  }


})();
