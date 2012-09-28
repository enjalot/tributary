
//Utility function for turning a gist into a bunch of tributary models
//returns an object with those models and descriptive information
tributary.gist = function(id, callback) {
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
