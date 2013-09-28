//Tributary display options
tributary.displays = [
  {name:"svg", description: "creates an <svg> element for you to use"},
  {name:"canvas", description: "creates a <canvas> element and gives you a Context for the canvas"},
  {name:"webgl", description: "gives you a Three.js WebGLRenderer scene"},
  {name:"html", description: "gives you <div id=display>"},
];

//TODO: add icons
tributary.time_controls = [
  {name:"play", description: "gives you a play button, and tributary.t. if you provide tributary.run(g,t) it will be executed in a run loop"},
  {name:"loop", description: "gives you a loop where tributary.t goes from 0 to 1."},
  {name:"restart", description: "assumes you only want tributary.init(g) to be run when the restart button is clicked"},
];

d3.selection.prototype.moveToFront = function() {
  return this.each(function() {
    this.parentNode.appendChild(this);
  });
};


tributary.appendSVGFragment = function(element, fragment) {
  //this should allow optional namespace declarations
  var svgpre = "<svg xmlns=http://www.w3.org/2000/svg xmlns:xlink=http://www.w3.org/1999/xlink>"; 
  var svgpost = "</svg>";
  var range = document.createRange();
  range.selectNode(element);
  var frag = range.createContextualFragment(svgpre + fragment + svgpost);
  var svgchildren = frag.childNodes[0].childNodes;
  //console.log(svgchildren);
  for(var i = 0, l = svgchildren.length; i < l; i++) {
    element.appendChild(svgchildren[0]);
  }
};


tributary.getContext = function(filename) {
  if(!tributary.__config__) return;
  var context = _.find(tributary.__config__.contexts, function(d) {
    return d.model.get("filename") === filename;
  })
 return context;
}
tributary.getCodeEditor = function(filename) {
  var context = tributary.getContext(filename);
  if(!context || !context.editor) return;
  return context.editor.cm;
}
tributary.getModel = function(filename) {
  var context = tributary.getContext(filename);
  if(!context || !context.model) return;
  return context.model;
}

