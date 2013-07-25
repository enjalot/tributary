
Tributary.plugin("screenshot", tributaryScreenshotPlugin);

function tributaryScreenshotPlugin(tributary, plugin) {
  var el;
  plugin.activate = function()  {
    //console.log("hi from screenshot plugin");
    el = document.getElementById(plugin.elId);
    // get the screenshot button and put it on the config panel
    d3.select("#thumbnail-content").node().appendChild(d3.select(el).select("#screenshot").node());
    d3.select("#screenshot").on("click", handleScreenshot);
    var link = tributary.__config__.get("thumbnail");
    // Update the thumbnail in the config panel
    if (link) {
      d3.select("#thumbnail-content").select("img").attr("src", link).style("display", "");
    }
  }
  plugin.deactivate = function()  {
    el = document.getElementById(plugin.elId);
    el.innerHTML = "";
  }

  function handleScreenshot() {
    var display = tributary.__config__.get("display");
    if(display === "svg") {
      svgScreenshot();
    } else if(display === "canvas" || display === "webgl") {
      canvasScreenshot();
    } else if(display === "div") {
      htmlScreenshot();
    }
  }
  function svgScreenshot() {
    //svg = d3.select("#display").html();
    var svg = new XMLSerializer().serializeToString(d3.select(".tributary_svg").node());
    var findstring = '<svg xmlns="http://www.w3.org/2000/svg" xlink:xlink="http://www.w3.org/1999/xlink" class="tributary_svg" width="100%" height="100%">';
    svg = svg.replace(findstring,'<svg>'); // hacky.
    //console.log("SVG", d3.select("#display").html())
    canvas = document.getElementById('pngit');
    canvg(canvas, svg, {renderCallback: function() {
      var len = "data:image/png;base64,".length;
      var img = canvas.toDataURL("image/png").substring(len);
      tributary.events.trigger("imgur", img);
    }});
  }
  function canvasScreenshot() {
    canvas = d3.select("#display canvas").node()
    var len = "data:image/png;base64,".length;
    var img = canvas.toDataURL("image/png").substring(len);
    tributary.events.trigger("imgur", img);
  }
  function htmlScreenshot() {
    html2canvas( [ d3.select("#display").node() ], {
      onrendered: function(canvas) {
        var len = "data:image/png;base64,".length;
        var img = canvas.toDataURL("image/png").substring(len);
        tributary.events.trigger("imgur", img);
    }
    });
  }

  return plugin;
}
