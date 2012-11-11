## Directory Structure

#tributary.js, tributary.min.js
    This is the meat of the code for tributary and all the views. This provides the Backbone model which drives the live code functionality.


#templates
Handlebars templates vor various ui components

#lib
The many js libraries tributary includes

#css
The stylesheets

#img
Static image assets

#java
experimental inclusion for doing MIDI in the browser

#svgs
experimental area for some svgs I was playing with.

#gallery.json
old way of generating a dynamic gallery, may revist

#views (depracated)
The views are the different endpoints of tributary which give us a different view of the code being developed. Each view extends the base tributary model and adds it's own assumptions.
The views have been ported to contexts and controls in the main tributary/src folder


