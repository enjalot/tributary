
(function() {


//if we have an inlet.svg lets add it
//need to give it an id and select on that
/*
var svg = d3.select("svg");
var w = parseInt(svg.attr("width"));
var h = parseInt(svg.attr("height"));
svg.attr("viewBox", "0 0 " + w + " " + h);
*/
//now we can resize our svg to whatever we want


//get the latest gists for this user
var url = "https://api.github.com/users/" + tributary.username + "/gists?per_page=20";

d3.json(url, function(gists) {
  d3.select("#syncing").style("display", "none");
  //console.log(gists);
  var usable = _.filter(gists, function(g) {
    if(g.files.hasOwnProperty("inlet.svg")) {
      return true;
    }
  })
  console.log(usable.length);
  console.log(JSON.stringify(usable))

  var model, view;
  usable.forEach(function(u) {
    //make a model for each gist
    model = new tributary.Pane(u);

    view = new tributary.PaneView({id: "pane" + model.id, model: model});
    view.render();

  })
  


  //TODO: paginate to get more
  //if we don't get enough we could try going back and paginating to get more gists
});




}());
