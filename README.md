Tributary
=========

Tributary is a javascript library for bringing the writing of code and its execution closer together. 
Tributary makes it easy to build your own prototyping environment by wiring together 
several existing tools for working with javascript.

Tributary powers the data visualization prototyping tool [tributary.io >](http://tributary.io)

Getting started
---------------
You can turn any CodeMirror editor into a live coding environment with a few lines of code:

tributary will create an iframe for code to be rendered in  
```javascript
var frame = new Tributary.Frame("#display");
```
the context is what does all the magic around interpreting the code  
```javascript
var jscontext = new Tributary.JSContext(frame);
```
The display will provide some default rendering environment (like an svg element in this case)  
```javascript
var display = new Tributary.SVGDisplay(frame);
```

we can hook up to events on the context, like before it re-runs the code
we can clear the display.   
we are using d3 events so they can be namespaced.
```javascript
jscontext.on("execute:pre.display", function() {
  display.clear();
})
````
we then setup our context to be updated when the code editor changes
```javascript
editor.on("change", function() {
  jscontext.code(editor.getValue());
})
```

### Setup

You can be up and running with just one script tag
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
Data visualization prototyping tool
[tributary.io >](http://tributary.io)

You can power arbitrary static pages with live code snippets


API
===

Introduction
------------
Tributary is broken up into two main parts: *Contexts* and *Displays*.
Context's provide a way to turn code (or any text) into something to be played with.  
A Display provides some default infrastructure for making it easy to use different graphical web standards.  

Contexts
--------
### JavaScript Context
### JSON Context
### CSV Context
### HTML Context
### SVG Context
### CoffeeScript Context

Displays
--------
### SVG Display
### HTML Display


Frame
-----
The Frame object lets you wall off your code and displays from the rest of your page easily.
It provides convenience methods for communicating with the frame as well.  
The default way of using it is for iframes with the same domain as the page.
This keeps the rendering and javascript scope clean but does not provide security. 
If you allow arbitrary user input to your code editors you should use tributary inside a quarantined iframe (using a different domain or subdomain). More on that [here >](https://github.com/enjalot/tributary/wiki/Security)





