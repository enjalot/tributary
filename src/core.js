
var tributary = {};
window.tributary = tributary;

//general event handler for any part of tributary to listen on
tributary.events = _.clone(Backbone.Events);

//special dict to hold data loaded in
tributary.data = {};

//convention for pulling variables out of code into controls
window.trib = {};
window.trib_options = {};

window.addEventListener('resize', function(event) {
  tributary.events.trigger("resize", event);
});

