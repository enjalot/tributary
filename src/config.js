
//The config model is the glue that binds together a particular configurtion
//of tributary components
tributary.Config = Backbone.Model.extend({
    defaults: {        
        endpoint: "tributary",
        public: true
    }
});


