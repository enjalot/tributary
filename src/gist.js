
//Utility function for turning a gist into a bunch of tributary models
//returns an object with those models and descriptive information
tributary.loadGist = function(data, callback) {
  var ret = {};
  if(data && tributary.__loaded__) return callback(null, { __loaded__: true })
  if(!data) {
    ret.config = new tributary.Config();
    ret.config.newFile = true;
    ret.models = new tributary.CodeModels(new tributary.CodeModel());
    return callback(null, ret);
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

  //per-file configurations
  fileconfigs = ret.config.get("fileconfigs") || {};

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

    if(!fileconfigs[f]) {
      //defaults for fileconfigs
      fileconfigs[f] = { "default": true, "vim": false, "emacs": false, "fontSize": 12 };
    }

  });
  ret.config.set("fileconfigs", fileconfigs);

  //ret.config.require(callback, ret);
  ret.config.require(function(err, res) {
    tributary.__loaded__ = true;
    callback(null, ret);
  });
}



