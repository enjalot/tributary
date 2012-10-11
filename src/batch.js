
tributary.batch = {};

tributary.batch._execute = function() {
  //iterate over all the keys of batch (functions) and execute them
  var funcs = _.functions(this);
  _.each(funcs, function(f) {
    if(f !== "_execute") {
      tributary.batch[f]();
    }
  })
}
