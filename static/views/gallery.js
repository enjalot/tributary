(function() {


tributary.Pane = Backbone.Model.extend({
    defaults: {
      width: 300,
      height: 300,
    }
});


tributary.PaneView = Backbone.View.extend({
  tagName: "div",

  render: function() {
    console.log("this", this);
  }

});

}());
