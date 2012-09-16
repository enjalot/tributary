(function() {

    tributary.Ocean = tributary.Tributary.extend({
        //For exploring animations, run loops 
        initialize: function() {
            this.binder();
            this.set({
                code: '\
var display = d3.select("#display");\n\
display.append("div").text("hello world")\n\
  .style("margin", [150, 0, 0, 150].join("px ") + "px");'
            });
        },
        execute: function() {
            var js = this.handle_coffee();
            try {

                var code = "tributary.initialize = function(g) {";
                code += js;
                code += "};";
                eval(code);

                this.trigger("noerror");
            } catch (e) {
                this.trigger("error", e);
            }

            try {

                $("#display").empty();
                tributary.initialize(d3.select("#display"));

                this.trigger("noerror");
            } catch (er) {
                this.trigger("error", er);
            }

            return true;
        }
    });

}());



