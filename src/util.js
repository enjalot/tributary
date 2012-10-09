
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
  //  filename: optional, default: inlet.js
  //  content: optional, default: ""
  //  display: optional, default: "d3.select("#display")
  //}
  var filename, content, display;
  var config = options.config;
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
  if(options.display) {
    display = options.display;
  } else {
    display = d3.select("#display"); 
  }


  var context;
  //figure out the context to make from the file extension
  var fn = filename.split(".");
  ext = fn[fn.length-1];

  //make a code model with the content
  var m = new tributary.CodeModel({name: fn[0], filename: filename, code: content});

  if(ext === "js") {
    context = new tributary.TributaryContext({
      config: config,
      model: m,
      el: display.node()
    });
  } else if(ext === "json") {
    context = new tributary.JSONContext({
      config: config,
      model: m,
    });
    context.execute();
  } else if(ext === "css") {
  } else if(ext === "html") {
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


