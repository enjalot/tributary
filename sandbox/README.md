# Sandbox

The tributary app is split into two parts, one part that handles logged in
behavior such as saving/forking and another part that handles all of the
user-code execution (as well as the majority of the UI)  

This is done to prevent cross-site scripting exploits in user generated
scripts. As a general rule you never trust the client, and you certainly don't
trust arbitrary user code.   


# Structure

* index.js  
  the sandbox is served from a mini express app defined in index.js. it's only
job is to serve up the inlet.handlebars template which creates all of the ui
below the header  

* templates/inlet.handlebars  
  the primary tributary ui, except for the header. this code cannot 
