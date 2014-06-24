
Tributary.plugin("screenshot", tributaryScreenshotPlugin);

function tributaryScreenshotPlugin(tributary, plugin) {
  var el;
  var width = 500;
  var height = 500;
  var header = 30;
  var delay = 150;
  var maxProgress = 70;
  plugin.activate = function()  {
    //console.log("hi from screenshot plugin");
    el = document.getElementById(plugin.elId);
    // get the screenshot button and put it on the config panel
    screenshotDiv = d3.select(el).select("#screenshot").node();
    if(!screenshotDiv) return;
    d3.select("#thumbnail-content").node().appendChild(screenshotDiv);
    d3.select("#screenshot").on("click", _handleScreenshot);

    d3.select("#controls")
    .selectAll("button#gif")
      .data([0])
    .enter()
    .append("div").classed("gif_button", true)
      .append("button")
      .attr("id", "gif")
      .text("GIF")
      .attr("title", "activate GIF mode. clicking anywhere on the display will capture a frame. click and hold for fun")
    tributary.__gif__ = false;
    var pngit = d3.select("#pngit").attr({
      width: tributary.sw,
      height: tributary.sh
    })
    //gif button
    d3.select("#gif").on("click", function() {
      tributary.__gif__ = !tributary.__gif__;
      d3.select("#gifpanel").style("display", tributary.__gif__ ? "" : "none" );
    });
    $('#gif').tipsy({fade: true, gravity: 'sw', opacity: 0.86});
    $('#gifclear').tipsy({fade: true, gravity: 'w', opacity: 0.86});
    $('#gifdone').tipsy({fade: true, gravity: 'sw', opacity: 0.86});
    d3.select("#gifclear").on("click", function() {
      tributary.__frames__ = [];
      renderFrames();
    })
    //for gifs
    tributary.__frames__ = [];
  }
  plugin.deactivate = function()  {
    el = document.getElementById(plugin.elId);
    el.innerHTML = "";
    tributary.__frames__ = null;
  }

  tributary._screenshot = _handleScreenshot;
  function _handleScreenshot() {
    function cb(img) {
      tributary.__events__.trigger("imgur", img);
    }
    handleScreenshot(cb);
  }
  function handleScreenshot(cb) {
    var display = tributary.__config__.get("display");
    if(display === "svg") {
      svgScreenshot(cb);
    } else if(display === "canvas" || display === "webgl") {
      canvasScreenshot(cb);
    } else if(display === "div") {
      htmlScreenshot(cb);
    }
  }
  function svgScreenshot(cb) {
    //svg = d3.select("#display").html();
    var svg = new XMLSerializer().serializeToString(d3.select(".tributary_svg").node());
    //var findstring = '<svg xmlns="http://www.w3.org/2000/svg" xlink:xlink="http://www.w3.org/1999/xlink" class="tributary_svg" width="100%" height="100%">';
    //svg = svg.replace(findstring,''); // hacky.
    svg = svg.replace(/^\<svg xmlns.+tributary_svg.+?>/,'<svg>'); // hacky.
    var canvas = document.getElementById('pngit');
    canvg(canvas, svg, {renderCallback: function() {
      var len = "data:image/png;base64,".length;
      var img = canvas.toDataURL("image/png").substring(len);
      cb(img);
      //tributary.__events__.trigger("imgur", img);
    }});
  }
  function canvasScreenshot(cb) {
    var canvas = d3.select("#display canvas").node()
    var len = "data:image/png;base64,".length;
    var img = canvas.toDataURL("image/png").substring(len);
    cb(img);
  }
  function htmlScreenshot(cb) {
    html2canvas( [ d3.select("#display").node() ], {
      onrendered: function(canvas) {
        var len = "data:image/png;base64,".length;
        var img = canvas.toDataURL("image/png").substring(len);
        cb(img);
      }
    });
  }

  d3.select("#display").on("mousemove.gif", move);
  d3.select("#display").on("mousedown.gif", down);
  d3.select("#display").on("mouseup.gif", up);
  d3.select("body").on("mouseup.gif", up);

  function move() {
    if(!tributary.__gif__) return;
  }
  var timer;
  var duration = 60;
  function down() {
    if(!tributary.__gif__) return;
    //set off screenshot timer
    function timeFn() {
      //take screenshot
      handleScreenshot(function(img) {
        img = "data:image/png;base64," + img;
        var image = new Image();
        image.src = img;
        image.onload = function() {
          var canv = document.getElementById('gifit');
          canv.width = tributary.sw;
          canv.height = tributary.sh;
          var ctx = canv.getContext('2d');
          ctx.drawImage(image, 0, 0);
          tributary.__frames__.unshift(img);
          renderFrames()
        };

      })
      timer = setTimeout(timeFn, duration);
    }
    timer = setTimeout(timeFn, duration);
  }
  function up() {
    //clear timer
    clearTimeout(timer);
  }

  function renderFrames() {
    var frames = d3.select("#gifframes").selectAll("img.frame")
      .data(tributary.__frames__)
    frames.enter()
    .append("img").classed("frame", true)
    frames
      .attr({
        src: function(frame) { return frame },
        width: "49px",
        height: "49px",
        title: "right click and Save As to keep this image"
      })
    frames.exit().remove();
  }

  d3.select("#gifdone").on("click", function() {
    var gif = new GIF({
      workers: 1,
      quality: 20,
      background: "#fff",
      width: tributary.sw,
      height: tributary.sh,
      workerScript: "/static/lib/gif.worker.js"
    });

    var q = queue(1)
    tributary.__frames__.reverse().forEach(function(frame) {
      q.defer(function(cb) {
        var image = new Image();
        image.src = frame;
        image.onload = function() {
          var ctx = d3.select("#gifit").node().getContext('2d');
          ctx.fillStyle ="#fff";
          ctx.fillRect(0, 0, tributary.sw, tributary.sh);
          ctx.drawImage(image, 0, 0)
          gif.addFrame(ctx, {delay:tributary.delay || delay, copy:true});
          setTimeout(function() {
            var ind = tributary.__frames__.indexOf(frame);
            tributary.__frames__.splice(ind, 1);
            renderFrames();
            cb();
          }, 20);
        };
      });
      q.awaitAll(function(err) {
        console.log("done");
        gif.on('progress', function(percent) {
          console.log("progress", percent)
          console.log(percent * maxProgress + "px")
          d3.select("#gifprogress").style({
            "width": percent * maxProgress + "px",
            "height": "20px",
            "background-color": d3.scale.linear().range(["#F8025B", "#38F514"]).interpolate(d3.interpolateHsl)(percent)
          });
        })
        gif.on('finished', function(blob) {
          var PBJ = URL.createObjectURL(blob)
          tributary.__frames__ = [PBJ];
          var reader = new FileReader();
          reader.addEventListener("loadend", function() {
            var len = "data:image/gif;base64,".length;
            var img = reader.result.substring(len);
            tributary.__events__.trigger("imgur", img);
             // reader.result contains the contents of blob as a typed array
          });
          reader.readAsDataURL(blob);
          //window.open(PBJ);
          renderFrames();

          $('.frame').tipsy({fade: true, gravity: 'sw', opacity: 0.86});

          tributary.__frames__ = [];
          d3.select("#gifprogress").style({
            "width": "0px",
            "height": "0px"
          })
        });
        gif.render();
      })
    })
  });

  return plugin;
}
