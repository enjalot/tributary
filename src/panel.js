
//TODO: put all the ui.js logic in here
//Build the panel
tributary.PanelView = Backbone.View.extend({
  initialize: function() {
    //Handlebars.registerPartial("config", Handlebars.templates.config);
    //Handlebars.registerPartial("files", Handlebars.templates.files);
  },
  render: function() {
    var that = this;

    var panel_data = ["edit", "config"];

    var template = Handlebars.templates.panel;
    var html = template(panel_data);

    this.$el.html(html);

    //panel holds the editors, and other controls
    panel = d3.select("#panel");
    //ui container for panel tabs (config/edit)
    panel_gui = d3.selectAll("#file-list");

    ////////////////////////////////////////////////////////////////////////
    // Setup the Panel GUI for switching between windows in the panel
    ////////////////////////////////////////////////////////////////////////

    var pb_w = 60; //width of each button
    var panel_buttons = panel_gui.selectAll("#file-list li")
    .on("click", function(d) {
      tributary.events.trigger("show", this.dataset.name);
    })

    //Logic for tabs
    tributary.events.on("show", function(name) {
      //hide all panel divs
      $(".tb_panel").children(".panel")
        .css("display", "none");

      //show the one we want
      panel.select(".tb_" + name)
        .style("display", "");

      //update the panel_gui ui
      panel_gui.selectAll("div.pb")
        .classed("gui_active", false);
      panel_gui.select(".tb_" + name + "_tab")
        .classed("gui_active", true);
    });
    tributary.events.trigger("show", "edit");


    // Logic for hiding panel?
    /*
    $('.tb_hide-panel-button').on("click", function(){
        tributary.events.trigger("hidepanel");

        $('#display').addClass("fullscreen")
        $('svg').addClass("fullscreen")

        $('#header').addClass("dimheader");

    })
    $('#show-codepanel-button').on("click", function(){
        tributary.events.trigger("showpanel");
        $('#display').removeClass("fullscreen");
        $('svg').removeClass("fullscreen")

        $('#header').removeClass("dimheader");
    })

    tributary.events.on("hidepanel", function(){

        $(".tb_panel").hide();
        $(".tb_panel_gui").hide();
        $(".tb_panel_handle").hide();
        $(".tb_panelfiles_gui").hide();

        $('#show-codepanel').show();

        //we want to save the panel show/hide in the config
        if(tributary.__config__) {
          tributary.__config__.set("hidepanel", true);
        }
    })

    tributary.events.on("showpanel", function(){

        $(".tb_panel").show();
        $(".tb_panel_gui").show();
        $(".tb_panel_handle").show();
        $(".tb_panelfiles_gui").show();

        $('#show-codepanel').hide();

        if(tributary.__config__) {
          tributary.__config__.set("hidepanel", false);
        }

    })

    */
  },
});


