tributary.keys = jwerty.KEYS.keys;
//get a list of the keys we can represent
tributary.keyskeys = Object.keys(tributary.keys);
//have event listeners on all of them (the keys of the piano)
tributary.funcs = d3.dispatch.apply(null, tributary.keyskeys); //this is mandatory

//we will tell the discs what keys are pressed through these events
//var keyvent = d3.dispatch("down", "up");
tributary.keyvent = new Backbone.Model();

//util function to look up human readable key from keycode
var findIt = function( targetObj, target ){ 
	for(key in targetObj){
    	if(targetObj.hasOwnProperty(key)){
        	if(targetObj[key] === target){ 
            	return key;
            }
        }
    }
    return null;
};

    
tributary.keydown = function() {
    var evt = d3.event;
  	var key = findIt(tributary.keys, evt.keyCode);
    if(key !== null) {
      //keyvent.down(key);
      tributary.keyvent.trigger("down", key);
    }
}
tributary.keyup = function() {
    var evt = d3.event;
	var key = findIt(tributary.keys, evt.keyCode);
    if(key !== null) {
      //keyvent.up(key);
      tributary.keyvent.trigger("up", key);
    }
}
//TODO: make this more transparent that we are usurping all the key events
d3.select(window).on("keydown", tributary.keydown);
d3.select(window).on("keyup", tributary.keyup);


tributary.Disc = function() {
  //rotating disc "sequencer"
  
  var bpm = 120;
  //beats per revolution
  var bpr = 4;
  //120 bpm with 4 bpr means 2 seconds per revolution
  
  var hitpoints = 4;
  
  var events = d3.dispatch("hit");
  
  //position
  var cx = 150;
  var cy = 150;
  
  //radii
  var ininr = 42;
  var inr = 77;
  var outr = 140;
  var midr;
  
  var arcw = 0.25872;
  
  //skin
  var fill = "#ffffff";
  var active_fill = "#0CC74F";
  var stroke = "#000000";
  var arc_color = "#0AE5F8";
  var hit_color = "#ff0000";
  var marker_color = "#000000";
  var colors = d3.scale.category10();
  
  var stroke_width = 3;
  var ring_width = 30;
  var hit_radius = 20;
  var hit_font_size = 40;
  
  

  //current angle
  var Θ = 0.1;
  //cycle angle, and old cycle angle for calculating hits
  var Θr = 0.1
  var oΘr = 0.1;
  
  //keep track of the time
  var t, ot;
  
  //the group this disc belongs to
  var g;
  
  var mspb;
  var arc = d3.svg.arc();
  
  var hitters = [];
  
  var active = false;
  var active_key = null;
  
  var disc = function(group) {
    
    g = group;
    
    //[ms]/[b] = 1 [m] / x [b] * [m] * 60 [s]/[m] * 1000[ms]/[s]
    //so replace x with 120 to get ms/b for 120bpm
    mspb = 60 * 1000 / bpm;
    
    midr = inr + (outr - inr)/2;
     
    arc.innerRadius(inr*1.04)
      .outerRadius(outr*0.98);
   
    for(var i = 0; i < hitpoints; i++) {
      hitters.push({});
    }
    //var hitdata = pie(hitters);
    //console.log(hitdata)
    hitters.forEach(function(d,i) {
      var w = 2*Math.PI/hitpoints;//Math.abs(d.endAngle - d.startAngle) / 2;
      var th = i * w;
  
      //var center = d.startAngle;// + w/2;
      var center = th;
      //console.log(center, w);
      //setup arcs
      d.startingAngle = center - w*arcw;
      d.endingAngle = center + w*arcw;
      d.centeringAngle = center;
      
      //hit angle (when angle passes this point, we hit)
      d.hit = th;
      d.w = w;
      d.index = i;
      
      //d.hit = (hitpoints - i - 1) * 2*Math.PI/hitpoints;
      //d.index = hitpoints - i - 1;
      d.key = "";
  
    })
    
  
    var mousedown = function() {
      active = true;
      g.select(".inner")
        .style("fill", active_fill)
    };
    var mouseup = function() {
      active = false;
      g.select(".inner")
        .transition()
        .duration(100)
        .style("fill", fill)
    };
    //we need to know if a key is being held down for recording
    tributary.keyvent.on("down", function(key) {
      active_key = key;    
      console.log("KEY", key)
    });
    tributary.keyvent.on("up", function(key) {
      //set whatever cycle we are on to the active key
      hitters.forEach(function(d, i) {
          //see if we made a hit for each one of our hits;
        //console.log(i, oΘr, d.hit, Θr)
          if(Θr >= d.hit && Θr <= d.hit + d.w) {
            //console.log("HIT!", d.index);
            events.hit(d.index);
            //console.log("or", oΘr, Θr, d.index, "hit", dhit);
          } else if(d.index === 0 && oΘr > Θr) {
            //console.log("cycle HIT!", d.index);
            events.hit(d.index);
            //console.log("or", oΘr, Θr, d.index, "hit", dhit);
          }
      });
      active_key = null;
  
    });
      
    g.attr("pointer-events", "all")
      .on("mousedown", mousedown)
      .on("touchstart", mousedown)
      .on("mouseup", mouseup)
      .on("touchend", mouseup)
   
      g.append("circle")
      .classed("ring", true)
      .attr("r", midr)
      .attr("cx", cx)
      .attr("cy", cy)
      .style("fill", fill)
      .style("stroke", stroke)
      .style("stroke-width", ring_width);
    
     g.append("circle")
      .classed("inner", true)
      .attr("r", ininr)
      .attr("cx", cx)
      .attr("cy", cy)
      .style("fill", fill)
      .style("stroke", stroke)
      .style("stroke-width", stroke_width);
    
    g.selectAll("path.hits")
      .data(hitters)
      .enter()
      .append("path")
      .classed("hits", true)
      .attr("transform", "translate(" + [cx,cy] + ")")
      //.attr("d", arc)
      .style("fill", function(d, i) {
        //return colors(i);
        return arc_color;
      })
      
      
    g.selectAll("circle.hits")
      .data(hitters)
      .enter()
      .append("circle")
      .classed("hits", true)
      .style("fill", "#FFFFFF")
      .style("stroke", "#000000")
      .style("stroke-width", 2)
      .attr("r", hit_radius)
    g.selectAll("text.hits")
      .data(hitters)
      .enter()
      .append("text")
      .classed("hits", true)
      .style("fill", "#000000")
      .style("font-size", hit_font_size)
      .attr("alignment-baseline", "central")
      .attr("text-anchor", "middle")

    
    /*  
    g.selectAll("text.numbers")
      .data(hitdata)
      .enter()
      .append("text")
      .classed("numbers", true)
      .text(function(d,i) {
        return d.index;
      })
      .style("fill", "#ff0000")
	*/

      
    g.append("circle")
      .classed("mark", true)
      .style("fill", marker_color)
      .attr("r", 5)
    
  };
  
  
  disc.update = function() {
    //update representations
    var th = -Math.PI/2;
    g.select("circle.mark")
      .attr("cx", cx + ininr * Math.cos(-Θ - th*2))
      .attr("cy", cy + ininr * Math.sin(-Θ - th*2))
      

    g.selectAll("path.hits")
      .attr("d", arc)
      
    g.selectAll("text.hits")
      .attr("transform", function(d,i) {
        var x = cx + midr * Math.cos(d.centerAngle + th);
        var y = cy + midr * Math.sin(d.centerAngle + th);
        return "translate(" + [x,y] + ")";
      })
    .text(function(d) {
		return d.key;
      })
    g.selectAll("circle.hits")
      .attr("transform", function(d,i) {
        var x = cx + midr * Math.cos(d.centerAngle + th);
        var y = cy + midr * Math.sin(d.centerAngle + th);
        return "translate(" + [x,y] + ")";
      })
      
      
      /*g.selectAll("text.numbers")
        .attr("transform", function(d,i) {
        var x = cx + midr * Math.cos(d.centerAngle + th);
        var y = cy + midr * Math.sin(d.centerAngle + th);
        return "translate(" + [x,y] + ")";
      })*/

  }
  
  disc.spin = function(dt) {
    //ot = t;
    //t += dt;
    oΘ = Θ;
    //spin the disc by dt (in miliseconds)
    //we want to make bpr revolutions per beat
    //so we need to calculate how much to rotate each update
    Θ +=  (2*Math.PI) * dt / mspb / bpr;
    
    //see where in the cycle we are
    oΘr = Θr;
    Θr = Math.abs(Θ + Math.PI/2) % (2*Math.PI);
    //console.log(Θr,oΘr);
  
    //console.log("or", oΘr, Θr);
   
    hitters.forEach(function(d, i) {
      	var th = -Θ -Math.PI/2
    	d.startAngle = th + d.startingAngle;
    	d.endAngle = th + d.endingAngle;
	    d.centerAngle = th + d.centeringAngle;
	    //see if we made a hit for each one of our hits;
      //console.log(i, oΘr, d.hit, Θr)
      	if(d.hit > oΘr && d.hit <= Θr) {
          //console.log("HIT!", d.index);
          events.hit(d.index);
          //console.log("or", oΘr, Θr, d.index, "hit", dhit);
        } else if(d.index === 0 && oΘr > Θr) {
          //console.log("cycle HIT!", d.index);
          events.hit(d.index);
          //console.log("or", oΘr, Θr, d.index, "hit", dhit);
        }
      
    });
    
    events.on("hit", function(hit) {
      //console.log("hit", hit, hitkeys[hit]);
      if(active) {
        //listen on keyboard events (if active) and assign
        //letters to whatever hits happen
        //also have erase
        if(active_key === "space") {
          hitters[hit].key = "";
        }
        else if(active_key !== null) {
          //record a key if pressed
          //hitkeys[hit] = active_key;
          //console.log("save", hit, active_key);
          hitters[hit].key = active_key;
        }
      }
      if(hitters[hit].key !== "") {
         //console.log(hit, hitters[hit].key)
 	     tributary.funcs[hitters[hit].key](mspb);
      }
      
      
      g.selectAll("path.hits")
        .filter(function(d) {
          return d.index === hit;
        })
        .style("fill", hit_color)
        .transition()
        .duration(100)
        .style("fill", arc_color);
      /*
      g.selectAll("circle.hits")
        .filter(function(d) {
          return d.index === hit;
        })
        .style("fill", hit_color)
        .transition()
        .duration(100)
        .style("fill", fill);
      */
    })
	
    disc.update();
  };

  disc.hitpoints = function(value) {
    if (!arguments.length) { return hitpoints; }
    hitpoints = value;
    return disc;
  };
  disc.bpm = function(value) {
    if (!arguments.length) { return bpm; }
    bpm = value;
    return disc;
  };
  disc.cx = function(value) {
    if (!arguments.length) { return cx; }
    cx = value;
    return disc;
  };
  disc.cy = function(value) {
    if (!arguments.length) { return cy; }
    cy = value;
    return disc;
  };
 

   //radii
  disc.ininr = function(value) {
    if (!arguments.length) { return ininr; }
    ininr = value;
    return disc;
  };
  disc.inr = function(value) {
    if (!arguments.length) { return inr; }
    inr = value;
    return disc;
  };
  disc.outr = function(value) {
    if (!arguments.length) { return outr; }
    outr = value;
    return disc;
  };
  disc.arcw = function(value) {
    if (!arguments.length) { return arcw; }
    arcw = value;
    return disc;
  };
  
  //skin
  disc.fill = function(value) {
    if (!arguments.length) { return fill; }
    fill = value;
    return disc;
  };
  disc.active_fill = function(value) {
    if (!arguments.length) { return active_fill; }
    active_fill = value;
    return disc;
  };
  disc.stroke = function(value) {
    if (!arguments.length) { return stroke; }
    stroke = value;
    return disc;
  };
  disc.arc_color = function(value) {
    if (!arguments.length) { return arc_color; }
    arc_color = value;
    return disc;
  };
  disc.hit_color = function(value) {
    if (!arguments.length) { return hit_color; }
    hit_color = value;
    return disc;
  };
  disc.marker_color = function(value) {
    if (!arguments.length) { return marker_color; }
    marker_color = value;
    return disc;
  };
  
  disc.stroke_width = function(value) {
    if (!arguments.length) { return stroke_width; }
    stroke_width = value;
    return disc;
  };
  disc.ring_width = function(value) {
    if (!arguments.length) { return ring_width; }
    ring_width = value;
    return disc;
  };
  disc.hit_radius = function(value) {
    if (!arguments.length) { return hit_radius; }
    hit_radius = value;
    return disc;
  };
  disc.hit_font_size = function(value) {
    if (!arguments.length) { return hit_font_size; }
    hit_font_size = value;
    return disc;
  };

  
  return disc;
 
}
    
