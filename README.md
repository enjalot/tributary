# Tributary
[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/enjalot/tributary?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
Tributary allows you to share live-editable code snippets. These snippets will
most likely use d3.js and allow a user to play with code in a very responsive
way.

Tributary is innovation on principle, taking the excellent work of Gabriel
Florit which was in turn inspired by Bret Victor's genius and making it sharable.

Tributary is a labor of love by Ian '@enjalot' Johnson and EJ '@mrejfox' Fox.

# Usage:
Start typing into the code editor and watch your code come to life!
If you want to save your work you can click the fork button and it will save into a gist.
The url in your browser will update to something like:
http://tributary.io/inlet/2958568

where the number: 2958568 is the gist id
(you can see it here: https://gist.github.com/2958568 )


# Development:

On the backend tributary only depends on node and mongodb:
To deploy locally run
```
git clone https://github.com/enjalot/tributary
cd ./tributary
npm install
node server.js
```

If you want to have github authentication working you will need to setup a
github app ( https://github.com/settings/applications ) and fill out the settings.js (see example-settings.js)
The github app should have the following settings:  
full URL: http://localhost:8888  
callback URL: http://localhost:8888/github-authenticated  

Right now you will also need to setup an imgur app and set the authentication details in settings.js as well


Frontend JS src file compilation with make to static requires node.js, uglify-js and browserify
```
npm install
```

You need to compile the frontend code and templates using make:
```
make
```
You can check the Makefile to see how it's done with uglify and handlebars.
there is also a watch.sh bash script which will recompile the frontend code
when any files change.  

To run the server you need to modify your /etc/hosts file and add
```
127.0.0.1 sandbox.localhost
```
this is because tributary uses a separate subdomain to execute unsafe code in an iframe.


Some 3rd party libraries are minified and catted together for convenience. The
result is found in /static/3rdparty.js
To see what those are and how they are bundled look at this repository:
http://github.com/enjalot/3rdparty



Reserved properties of the tributary object:
tributary.initialize  
tributary.init  
tributary.run  
tributary.g  
tributary.ctx  
tributary.t  
tributary.dt  
tributary.loop  
tributary.loop_type  
tributary.autoinit  
tributary.pause  
tributary.bv  
tributary.nclones  
tributary.clone_opacity  
tributary.duration  
tributary.ease  
tributary.reverse  
tributary.render  


# Usage as a node module



###Contexts

I'm using latest CodeMirror from git (updating every-so often)  
I have customized the JSHINT options in addons/lint/javascript-lint.js to be:
```
{
  asi: true,
  laxcomma: true,
  laxbreak: true,
  loopfunc: true,
  smarttabs: true,
  sub: true
}
```




### TODO:  

#### Editor UI:  
+ re-enable vim and emacs mode (add ui for those selections somewhere)  
+ re-enable local storage backups per editor (need it so you can load code back but not execute it)  

#### File UI:  
+ open file from disk (file dialog)  
+ edit filename  
+ delete files  

+ Embedding example (simpler UI, assemble from fewer pieces)  

+ Make BV button work for any of the renders (not just svg)  

#### Contexts

+ enable number scrubbing for text mode (csv and tsv files)


