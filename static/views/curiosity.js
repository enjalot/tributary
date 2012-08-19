(function() {

tributary.Curiosity = tributary.Tributary.extend({
    execute: function() {   
        var js = this.handle_coffee();
        try {
            
            //wrap the code in a closure
            var code = "tributary.initialize = function() {";
            code += js;
            code += "};";
            eval(code);


        } catch (e) {
            this.trigger("error", e);
            return false;
        }
        
        //we don't want it to nuke the svg if there is an error
        try {
            tributary.scene.clear();
            //for the datGUI stuff
            // window.trib = {};               //reset global trib object
            // window.trib_options = {};       //reset global trib_options object
            // trib = window.trib;
            // trib_options = window.trib_options;
            // $("svg.tributary_svg").empty();
            tributary.initialize();
            tributary.render();
        } catch (er) {
            this.trigger("error", er);
            return false;
        }
        this.trigger("noerror");

        return true;
    }
});


var container, stats;

//var tributary.camera, tributary.scene, tributary.renderer;

var targetRotation = 0;
var targetRotationOnMouseDown = 0;

var mouseX = 0;
var mouseXOnMouseDown = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;


tributary.init3js = function () {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    tributary.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
    tributary.camera.position.y = 150;
    tributary.camera.position.z = 500;

    tributary.scene = new THREE.Scene();

    THREE.Object3D.prototype.clear = function(){
        var children = this.children;
        for(var i = children.length-1;i>=0;i--){
            var child = children[i];
            child.clear();
            this.remove(child);
        };
    };
    tributary.renderer = new THREE.CanvasRenderer();
    tributary.renderer.setSize( window.innerWidth, window.innerHeight );

    container.appendChild( tributary.renderer.domElement );

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.right = '0px';
    stats.domElement.style.top = '0px';
    container.appendChild( stats.domElement );
    tributary.renderer.render( tributary.scene, tributary.camera );

    tributary.initialize = function(){ 
       
    };
    tributary.initialize();


    window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    tributary.camera.aspect = window.innerWidth / window.innerHeight;
    tributary.camera.updateProjectionMatrix();

    tributary.renderer.setSize( window.innerWidth, window.innerHeight );

}


//

tributary.animate = function() {

    requestAnimationFrame( tributary.animate );

    tributary.render();
    stats.update();

}

tributary.render = function() {
    tributary.renderer.render( tributary.scene, tributary.camera );

}

tributary.init3js();
tributary.animate();



}());


