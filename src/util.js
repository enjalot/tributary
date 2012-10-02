
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






d3.selection.prototype.moveToFront = function() { 
  return this.each(function() { 
    this.parentNode.appendChild(this); 
  }); 
};


