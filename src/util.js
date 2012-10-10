
//Tributary display options
tributary.displays = [
  {name:"svg", description: "creates an <svg> element for you to use"},
  {name:"canvas", description: "creates a <canvas> element and gives you a Context for the canvas"},
  {name:"webgl", description: "gives you a Three.js WebGLRenderer scene"},
  {name:"div", description: "gives you a plain old <div>"},
];

//TODO: add icons
tributary.time_controls = [
  {name:"play", description: "gives you a play button, and tributary.t. if you provide tributary.run(g,t) it will be executed in a run loop"},
  {name:"loop", description: "gives you a loop where tributary.t goes from 0 to 1."},
  {name:"restart", description: "assumes you only want tributary.init(g) to be run when the restart button is clicked"},
];


tributary.make_context = function(options) {
  //Creates a context from a filename and/or file content
  //{
  //  config: REQUIRED
  //  model: optional, if a CodeModel is passed in, filename and content wont be used
  //  filename: optional, default: inlet.js
  //  content: optional, default: ""
  //  display: optional, default: "d3.select("#display")
  //}
  var context, model,display, type;
  var config = options.config;
  if(options.model) {
    model = options.model;
    filename = model.get("filename");
    type = model.get("type");
  } else {
    var filename, content;
    if(options.filename){
      filename = options.filename;
    } else {
      filename = "inlet.js";
    }
    if(options.content) {
      content = options.content;
    } else {
      content = "";
    }
    //figure out the context to make from the file extension
    var fn = filename.split(".");
    type = fn[fn.length-1];

    //make a code model with the content
    model = new tributary.CodeModel({name: fn[0], filename: filename, code: content});

  }
  if(options.display) {
    display = options.display;
  } else {
    display = d3.select("#display"); 
  }
  
  if(filename === "inlet.js") {
    context = new tributary.TributaryContext({
      config: config,
      model: model,
      el: display.node()
    });
  } else if(type === "json") {
    context = new tributary.JSONContext({
      config: config,
      model: model,
    });
  } else if(type === "csv") {
    context = new tributary.CSVContext({
      config: config,
      model: model,
    });
  } else if(type === "js") {
    context = new tributary.JSContext({
      config: config,
      model: model,
    });
  } else if(type === "css") {
    context = new tributary.CSSContext({
      config: config,
      model: model,
    });
  } else if(type === "html") {
    //TODO: enable this when it becomes useful
    /*
    context = new tributary.HTMLContext({
      config: config,
      model: model,
      el: display.node()
    });
    */
  } else {
  }

  return context;
}


tributary.make_editor = function(options) {
  //Creates a editor from a model and optional editor container
  //{
  //  model: REQUIRED
  //  container: optional, default: tributary.edit.append("div") with model.cid as id
  //}

  var model = options.model;
  if(options.container) {
    container = options.container;
  } else {
    container = tributary.edit.append("div")
      .attr("id", model.cid);
  }
  var editor;
  editor = new tributary.Editor({
    el: container.node(),
    model: model
  });
  editor.render();
  return editor;
}


d3.selection.prototype.moveToFront = function() { 
  return this.each(function() { 
    this.parentNode.appendChild(this); 
  }); 
};


