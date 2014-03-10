/*
 * The Main function is the backbone of the contexts.
 * it listens on execute events and does things like clean, execute and render
 * as well as emitting events along the way
 */
tributary.Main = function(options) {
  var el = options.el;
  tributary.__events__.on("execute", execute, this);

  if(!tributary.__config__) {
    tributary.__config__ = new tributary.Config();
  }
  this.config = tributary.__config__;
  this.config.on("change:display", set_display, this);

  tributary.init = undefined;
  tributary.run = undefined;

  //autoinit determins whether we call tributary.init by default
  tributary.autoinit = this.config.get("autoinit");
  tributary.render = function() {};
  tributary.execute = function() {};
  tributary.clear = function() {};

  function execute() {
    if(tributary.__noupdate__) return;
    try {
      //empty out our display element
      if(tributary.autoinit) {
        tributary.clear();
        //trigger all the contexts to execute, after the canvas has been cleared
        tributary.__events__.trigger("post:execute");
      }
      //then we run the user defined run function
      tributary.execute();
      tributary.render();
    } catch (err) {
      return false;
    }
    return true;
  }

  tributary.__displayFns__ = {
    "svg": makeSvg,
    "div": makeDiv,
    "canvas": makeCanvas,
    "webgl": makeWebgl
  }

  function set_display() {
    tributary.clearAll();
    var display = this.config.get("display");
    var fn = tributary.__displayFns__[display]
    if(fn) { fn(el); }
    else {
      tributary.clear = function() {
        d3.select(el).selectAll("*").remove();
      };
    }
  }

  tributary.clearAll = function() {
    d3.select("#display").selectAll("*").remove();
  }

  function makeDiv(el) {
    tributary.__svg__ = null;
    tributary.g = d3.select(el);
  }

  function makeSvg(el) {
    //Use mustache or other templates here? naaah...
    var svg = d3.select(el).append("svg")
      .attr({
        "xmlns":"http://www.w3.org/2000/svg",
        //this usually requires xmlns:xlink but chrome wont let me add that
        "xlink":"http://www.w3.org/1999/xlink",
        class:"tributary_svg",
        width: "100%",
        height: "100%"
      });
    tributary.g = svg;
    tributary.__svg__ = svg;
    tributary.clear = function() {
      tributary.__svg__.selectAll("*").remove();
    };
  }

  function makeCanvas(el) {
    tributary.__svg__ = null;
    tributary.clear = function() {
      tributary.canvas.width = tributary.sw;
      tributary.canvas.height = tributary.sh;
      tributary.ctx.clearRect(0, 0, tributary.sw, tributary.sh);
    };
    tributary.canvas = d3.select(el).append("canvas")
      .classed("tributary_canvas",true)
      .node();
    tributary.ctx = tributary.canvas.getContext('2d');
    tributary.g = tributary.ctx;
  }

  function makeWebgl() {
    tributary.__svg__ = null;
    container = el;
    tributary.camera = new THREE.PerspectiveCamera(70, tributary.sw / tributary.sh, 1, 1e3);
    tributary.camera.position.y = 150;
    tributary.camera.position.z = 500;
    tributary.scene = new THREE.Scene;
    tributary.scene.add(tributary.camera);
    THREE.Object3D.prototype.clear = function() {
      var children = this.children;
      var i;
      for (i = children.length - 1; i >= 0; i--) {
        var child = children[i];
        if (child == tributary.camera) continue;
        child.clear();
        this.remove(child);
      }
    };
    tributary.renderer = new THREE.WebGLRenderer;
    tributary.renderer.setSize(tributary.sw, tributary.sh);
    container.appendChild(tributary.renderer.domElement);
    // TODO: don't hardcode #display here?
    var controls = new THREE.TrackballControls(tributary.camera, d3.select("#display").node());
    controls.target.set(0, 0, 0);
    controls.rotateSpeed = 1;
    controls.zoomSpeed = .4;
    controls.panSpeed = .8;
    controls.noZoom = true;
    controls.noPan = false;
    controls.staticMoving = false;
    controls.dynamicDampingFactor = .15;
    tributary.useThreejsControls = true;
    tributary.__threeControls__ = controls;
    tributary.render = function() {
      tributary.renderer.render(tributary.scene, tributary.camera);
    };
    d3.timer(function() {
      if (tributary.useThreejsControls && tributary.__threeControls__) {
        tributary.__threeControls__.update();
      }
      tributary.render();
    });
    function onWindowResize() {
      windowHalfX = tributary.sw / 2;
      windowHalfY = tributary.sh / 2;
      tributary.camera.aspect = tributary.sw / tributary.sh;
      tributary.camera.updateProjectionMatrix();
      tributary.renderer.setSize(tributary.sw, tributary.sh);
    }
    tributary.__events__.on("resize", onWindowResize, false);
    tributary.clear = function() {
      tributary.scene.clear();
    };
  }

  set_display.call(this);
}
