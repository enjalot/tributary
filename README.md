Tributary
=========

Tributary is a javascript library for bringing the writing of code and its execution closer together. 
Tributary makes it easy to build your own prototyping environment by wiring together 
several existing tools for working with javascript.

Tributary powers the data visualization prototyping tool [tributary.io][http://tributary.io]

Getting started
---------------
You can turn any CodeMirror editor into a live coding environment with a few lines of code:
```javascript
//tributary will create an iframe for code to be rendered in
var frame = new Tributary.Frame("#display");
//the Context is what does all the magic around interpreting the code
var jscontext = new Tributary.JSContext(frame);
//The display will provide some default rendering environment (like an svg element in this case)
var display = new Tributary.SVGDisplay(frame);

//we can hook up to events on the context, like before it re-runs the code
//we can clear the display. we are using d3 events so they can be namespaced.
jscontext.on("execute:pre.display", function() {
  display.clear();
})
//tie a display to our context
editor.on("change", function() {
  jscontext.code(editor.getValue());
})
}
```

### Setup

You can be up and running with just this
```html
  <script type="javascript" src="http://enjalot.github.io/tributary/tributary.v0.min.js"></script>
```

If you want tributary to provide you with CodeMirror and some other useful tools like JSHint you can use the 3rdparty lib 
```html
  <link  href='http://enjalot.github.io/tributary/tributary.3rdparty.css' rel='stylesheet'>
  <script src="http://enjalot.github.io/tributary/tributary.3rdparty.min.js" type="javascript" ></script>
```


Advanced Environments
---------------------

You can compose tributary contexts to make more complex environments
### Setup multiple contexts



Event Model
-----------

Each piece of tributary listens and emits certain events.  
The following diagram shows one way to group the components by functionality:


Examples
--------
[tributary.io >][http://tributary.io] - Data visualization prototyping tool

You can power arbitrary static pages with live code snippets
