var dvl = require("../../dvl");

var vows = require("vows"),
    assert = require("assert");

var suite = vows.describe("dvl.knows");

suite.addBatch({
  "knows tests": {
    "knows variables": function() {
      var v = dvl.def(2);
      assert.strictEqual(dvl.knows(v), true);
    },

    "knows constants": function() {
      var c = dvl.const(4);
      assert.strictEqual(dvl.knows(c), true);
    },

    "doesn't know regulars": function() {
      var c = 'poo';
      assert.strictEqual(dvl.knows(c), false);
    },

    "doesn't know nulls": function() {
      var c = null;
      assert.strictEqual(dvl.knows(c), false);
    },

    "doesn't know unedefined": function() {
      var c = undefined;
      assert.strictEqual(dvl.knows(c), false);
    },

    "doesn't know fake variables": function() {
      var v = dvl.def(2);
      var vFake = {};
      for (var key in v) vFake[key] = v[key];
      assert.strictEqual(dvl.knows(vFake), false);
    },

    "doesn't know fake constants": function() {
      var c = dvl.const(4);
      var cFake = {};
      for (var key in c) cFake[key] = c[key];
      assert.strictEqual(dvl.knows(cFake), false);
    },
  },
});


suite.export(module);
