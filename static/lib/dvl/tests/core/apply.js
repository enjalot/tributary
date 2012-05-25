var dvl = require("../../dvl");

var vows = require("vows"),
    assert = require("assert");

var suite = vows.describe("dvl.apply");

suite.addBatch({
  "basic apply": {
    topic: function() {
      var t = {
        runs: 0,
        a: dvl.def(3).name('a'),
        invalid: dvl.def(10)
      }

      t.b = dvl.apply({
        args: [t.a],
        fn: function(a) {
          t.runs++;
          return a * 7;
        },
        invalid: t.invalid
      });

      return t;
    },

    "correct initial run": function(t) {
      assert.strictEqual(t.runs, 1);
      assert.strictEqual(t.b.value(), 21);
    },

    "correct next run": function(t) {
      t.a.value(4)
      assert.strictEqual(t.runs, 2);
      assert.strictEqual(t.b.value(), 28);
    },

    "correct invalid": function(t) {
      t.a.value(null)
      assert.strictEqual(t.runs, 2);
      assert.strictEqual(t.b.value(), 10);
    },

    "correct on invalid change": function(t) {
      t.invalid.value(20)
      assert.strictEqual(t.runs, 2);
      assert.strictEqual(t.b.value(), 20);
    },
  },


  // "basic register / const": {
  //   topic: function() {
  //     var t = {
  //       runs: 0,
  //       a: dvl.const(3).name('a')
  //     }

  //     dvl.register({
  //       listen: [t.a],
  //       fn: function() { t.runs++; }
  //     });

  //     return t;
  //   },

  //   "always unchaged": function(t) {
  //     assert.strictEqual(t.runs, 1);

  //     t.a.value(4);
  //     dvl.notify(t.a);
  //     assert.strictEqual(t.runs, 1);

  //     t.a.value(4).notify();
  //     assert.strictEqual(t.runs, 1);

  //     t.a.notify();
  //     assert.strictEqual(t.runs, 1);
  //   },
  // },


  // "basic register / no init run": {
  //   topic: function() {
  //     var t = {
  //       runs: 0,
  //       a: dvl.def(3).name('a')
  //     }

  //     dvl.register({
  //       listen: [t.a],
  //       noRun: true,
  //       fn: function() {
  //         t.runs++;
  //       }
  //     });

  //     return t;
  //   },

  //   "correct initial run": function(t) {
  //     assert.strictEqual(t.runs, 0);
  //   },

  //   "correct next run": function(t) {
  //     t.a.value(4).notify();
  //     assert.strictEqual(t.runs, 1);
  //   }
  // },


  // "change and listen register": {
  //   topic: function() {
  //     var t = {
  //       runs: 0,
  //       a: dvl.def(3).name('a'),
  //       b: dvl.def(null).name('b')
  //     }

  //     dvl.register({
  //       listen: [t.a],
  //       change: [t.b],
  //       fn: function() {
  //         t.b.value(t.a.value() * 5).notify();
  //         t.runs++;
  //       }
  //     });

  //     return t;
  //   },

  //   "correct initial run": function(t) {
  //     assert.strictEqual(t.runs, 1);
  //     assert.strictEqual(t.b.value(), 15);
  //   },

  //   "correct next run": function(t) {
  //     t.a.value(4).notify();
  //     assert.strictEqual(t.runs, 2);
  //     assert.strictEqual(t.b.value(), 20);
  //   }
  // },


  // "circular register": {
  //   topic: function() {
  //     var t = {
  //       runs: 0,
  //       a: dvl.def(3).name('a'),
  //       b: dvl.def(null).name('b')
  //     }

  //     dvl.register({
  //       listen: [t.a],
  //       change: [t.b],
  //       fn: function() {
  //         t.b.value(t.a.value() * 5).notify();
  //         t.runs++;
  //       }
  //     });

  //     return t;
  //   },

  //   "cant make circular": function(t) {
  //     assert.throws(function() {
  //       dvl.register({
  //         listen: [t.b],
  //         change: [t.a],
  //         fn: function() { "whatever" }
  //       });
  //     });
  //   },
  // },
});

suite.export(module);
