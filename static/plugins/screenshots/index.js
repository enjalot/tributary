
Tributary.plugin("screenshot", tributaryScreenshotPlugin);

function tributaryScreenshotPlugin(tributary, plugin) {
  var el;
  var width = 500;
  var height = 500;
  var header = 30;
  var delay = 150;
  plugin.activate = function()  {
    //console.log("hi from screenshot plugin");
    el = document.getElementById(plugin.elId);
    // get the screenshot button and put it on the config panel
    d3.select("#thumbnail-content").node().appendChild(d3.select(el).select("#screenshot").node());
    d3.select("#screenshot").on("click", handleScreenshot);

    d3.select(".time_controls").append("button").attr("id", "gif").text("GIF");
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
      tributary.events.trigger("imgur", img);
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
      //tributary.events.trigger("imgur", img);
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
          tributary.__frames__.push(img);
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
    var frames = d3.select("#gifpanel").selectAll("img.frame")
      .data(tributary.__frames__)
    frames.enter()
    .append("img").classed("frame", true)
    frames
      .attr({
        src: function(frame) { return frame },
        width: "100px",
        height: "100px"
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
    tributary.__frames__.forEach(function(frame) {
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
        })
        gif.on('finished', function(blob) {
          var PBJ = URL.createObjectURL(blob)
          tributary.__frames__ = [PBJ];
          //window.open(PBJ);
          renderFrames();
          tributary.__frames__ = [];
        });
        gif.render();
      })
    })
  });

  return plugin;
}
