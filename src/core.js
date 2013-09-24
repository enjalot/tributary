
var tributary = {};
//window.tributary = tributary;

//general event handler for any part of tributary to listen on
tributary.__events__ = _.clone(Backbone.Events);
//global events (for letting tributary instances know whats up)
Tributary.events = _.clone(Backbone.Events);

//special dict to hold data loaded in
tributary.data = {};

//convention for pulling variables out of code into controls
window.trib = {};
window.trib_options = {};

window.addEventListener('resize', function(event) {
  tributary.__events__.trigger("resize", event);
});

