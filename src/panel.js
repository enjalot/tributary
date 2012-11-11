
//Build the panel
tributary.PanelView = Backbone.View.extend({
  initialize: function() {
    Handlebars.registerPartial("config", Handlebars.templates.config);
    Handlebars.registerPartial("files", Handlebars.templates.files);
  },
  render: function() {
    var that = this;

    var template = Handlebars.templates.panel;
    var html = template({ });
    console.log("HELLO", html);

    this.$el.html(html);

  },
});


