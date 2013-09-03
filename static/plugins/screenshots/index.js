
Tributary.plugin("screenshot", tributaryScreenshotPlugin);

function tributaryScreenshotPlugin(tributary, plugin) {
  var el;
  var delay = 100;
  var width = 500;
  var height = 500;
  var header = 30;
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
      pngit.style("display", tributary.__gif__ ? "" : "none" );
      d3.select("#gifpanel").style("display", tributary.__gif__ ? "" : "none" );
    });
    //for gifs
    tributary.__frames__ = [];
    tributary.__rect__ = {x: 0, y: 0, width: width, height: height};
    tributary.__ghost__ = {x: 0, y: 0, width: width, height: height};

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

  function drawRect(rect, ghost) {
    var canvas = document.getElementById('pngit');
    var ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    if(!ghost) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fill();
    }
    ctx.lineWidth = 1;
    if(ghost) {
      var frames = tributary.__frames__;
      var frame = frames[frames.length-1];
      if(frame) {
        var image = new Image();
        image.src = frame;
        image.onload = function() {
        ctx.drawImage(image, 0, header);
        //ctx.drawImage(image, 0, 0, ghost.width, ghost.height, ghost.x, ghost.y + header, ghost.width, ghost.height);
        };
      }
      if(ctx.setLineDash) ctx.setLineDash([2,3]);
    }
    ctx.strokeStyle = 'orange';
    ctx.stroke();
  }
  function clear() {
    var canvas = document.getElementById('pngit');
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, tributary.sw, tributary.sh);
    //ctx.fillStyle ="#fff";
    //ctx.fillRect(0, 0, tributary.sw, tributary.sh);
  }
  function render() {
    var rect = tributary.__rect__;
    var ghost = tributary.__ghost__;
    clear();

    drawRect(rect);
    drawRect(ghost, true);
  }
  function move() {
    if(!tributary.__gif__) return;
    var rect = tributary.__rect__;

    rect.x = d3.event.x - rect.width/2;
    rect.y = d3.event.y - rect.height/2;
    //console.log("RECT", rect)
    render();
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
          canv.width = width;
          canv.height = height;
          var ctx = canv.getContext('2d');
          ctx.drawImage(image, ghost.x, ghost.y);
          tributary.__frames__.push(img);
          renderFrames()
        };

      })
      timer = setTimeout(timeFn, duration);
    }
    timer = setTimeout(timeFn, duration);
    var ghost = tributary.__ghost__;
    ghost.x = d3.event.x - ghost.width/2;
    ghost.y = d3.event.y - ghost.height/2;
    render();
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
      width: width,
      height: height,
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
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(image, 0, 0)
          gif.addFrame(ctx, {delay:delay, copy:true});
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
