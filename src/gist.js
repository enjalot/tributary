
//Utility function for turning a gist into a bunch of tributary models
//returns an object with those models and descriptive information
function tributary.gist(id) {

  //return object
  var ret = {};

  var cachebust = "?cachebust=" + Math.random() * 4242424242424242;


  d3.json('https://api.github.com/gists/' + id + cachebust, function(data) {

      //get user information or set to anon if none.
      if(data.user === null || data.user === undefined) {
          ret.user = {
              login: "anon",
              url: "",
              userid: -1
          };
      } else {
        ret.user = data.user;
      }




  })





}
