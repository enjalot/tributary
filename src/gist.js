
//Utility function for turning a gist into a bunch of tributary models
//returns an object with those models and descriptive information
tributary.gist = function(id, callback) {
  tributary.gistid = id;
  //return object
  var ret = {};

  var cachebust = "?cachebust=" + Math.random() * 4242424242424242;


  d3.json('https://api.github.com/gists/' + id + cachebust, function(data) {

    //get user information or set to anon if none.
    if(data.user === null || data.user === undefined) {
        ret.user = {
            login: "anon",
            url: "",
            userid: -1
        };
    } else {
      ret.user = data.user;
    }

    //We load the configuration for this gist found in config.json
    var config;
    try {
      config = data.files["config.json"];
    } catch (er) {
      config = false;
    }
    if(config) {
      try {
        ret.config = new tributary.Config(JSON.parse(config.content));
      } catch (e){
        ret.config = new tributary.Config();
      }
    } else {
      ret.config = new tributary.Config();
    }

    //Go through the files and create appropriate models for them
    var files = _.keys(data.files);
    //console.log("files", files)
    
    ret.models = new tributary.CodeModels();
    var fsplit, model, context, i = 0, ext;
    files.forEach(function(f) {
      fsplit = f.split("."); 
      ext = fsplit[fsplit.length-1]; //file extension

      //make a code model for all files except config.json
      if(f !== "config.json") {
        model = new tributary.CodeModel({
          "filename":f,
          "name":fsplit[0],
          "code":data.files[f].content,
          "type": ext,
          //"config": ret.config.toJSON() //TODO: set the config for this file!
        });
        ret.models.add(model);
      }

      
    });

    ret.config.require(callback, ret);
    //callback(ret);
  });
};


tributary.save_gist = function(config, saveorfork, callback) {
  var oldgist = tributary.gistid || "";

  var gist = {
      description: 'just another inlet to tributary',
      public: config.get("public"),
      files: {}
  };

  //save each model back into the gist
  config.contexts.forEach(function(context) {
    gist.files[context.model.get("filename")] = {
        content: context.model.get("code")
    };
  });

  //save config
  gist.files["config.json"] = {
    content: JSON.stringify(config.toJSON())
  };

  if(config.display === "svg") {
    //serialize the current svg and save it to gist
    var node = d3.select("svg").node();
    var svgxml = (new XMLSerializer()).serializeToString(node);

    if($.browser.webkit){ 
        svgxml = svgxml.replace(/ xlink/g, ' xmlns:xlink');
        svgxml = svgxml.replace(/ href/g, ' xlink:href');
    }
    gist.files["inlet.svg"] = {
      content: svgxml
    };
  }

  var url;
  if(saveorfork === "save") {
    url = '/tributary/save';
  } else if(saveorfork === "fork") {
    url = '/tributary/fork';
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
      var newgist = data.id;
      var newurl = "/tributary/" + newgist;
      callback(newurl, newgist);
  });
};
tributary.login_gist = function(loginorout, callback) {
  var url;
  if(loginorout) {
    url = '/github-logout';
  } else {
    url = '/github-login';
  }
  url += '/tributary';
  if (tributary.gistid) {
    url+= '/' + tributary.gistid;
  }
  //window.location = url
  callback(url);
};


