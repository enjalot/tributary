# DVL

**DVL** is a free functionally reactive library written in JavaScript. DVL is based on the idea that data, not control flow is the most importnatn aspect of a program focused on data visulaization.

DVL is built on top of [D3](http://mbostock.github.com/d3/) to allow for dynamic data binding to the DOM.

## Usage

The code DVL functionality can be described with the following functions:

**dvl.def**

Creates a wrapped variable that can dispatch events.

		var x = dvl.def(5);
		x.get(); //== 5
		x.set(7);
		x.get(); //== 7
		x.notify();

The above example creates a wrapped DVL variable with an initial value of 5. This value can be modified through x.get() and x.set(7). To announce to the rest of the program that x has changed x.notify() can be called.

The null value is used to mark that a variable is invalid.

**dvl.register**

Registers a function to be called whenever any of the registered listened to objects change as well as announcing what objects the function might modify.

		var a = dvl.def(5);
		var b = dvl.def(12);
		var c = dvl.def(null);

		function calc() {
			var av = a.get();
			var bv = b.get();
			if (av !== null && bv !== null) {
				c.set(Math.sqrt(av*av + bv*bv));
				c.notify();
			} else {
				c.set(null);
				c.notify();
			}
		}

		dvl.register({
			fn: calc,
			listen: [a, b],
			change: [c]
		});

		c.get() //== 13

		a.set(3).notify()
		b.set(4).notify()
		c.get() //== 5

The above example ensures that calc will be run when a or b change, updating c.

We must explicitly declare that calc will be changing c. This is important for DVL to calculate the dependency graph and ensure that it is acyclic. Modifying a variable without specifying that it might be modified will raise an error.

**dvl.apply**

The apply function is a short-form for simplifying a common pattern found in DVL.

		var a = dvl.def(5);
		var b = dvl.def(12);

		var c = dvl.apply(
		  [a, b],
		  function(av, bv) { return Math.sqrt(av*av + bv*bv); }
		);

		c.get() //== 13

		a.set(3).notify()
		b.set(4).notify()
		c.get() //== 5

The above example is equivalent to the example given for dvl.register.

## Credits

[Vadim Ogievetsky](http://vadim.ogievetsky.com)

[Barret Schloerke](http://github.com/schloerke)

With invaluable advice from [Mike Bostock](http://bost.ocks.org/mike/)












