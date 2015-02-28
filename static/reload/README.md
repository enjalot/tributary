# Reloading the UI and restarting the server
By running the shell script `./runtributary` during development, your web pages will reload when you make changes in tributary, and the server will restart when you make changes to the server file or the settings file.

## Installataion
### Installing nodemon
You must install nodemon globally by this command

         npm install nodemon -g


### The LiveReload plugin
In order to have a browser reload its pages, you need to get the `livereoad` plugin for your broswer by visiting [http://help.livereload.com/kb/general-use/browser-extensions](http://help.livereload.com/kb/general-use/browser-extensions)


## Enabling the plugin
You'll need to enable the plugin for each tab that you want reloaded automatically. When you start a new browser, make sure that the plugin is enabled.

## How it works
## Running the server
`./runtributary` uses [`nodemon`](https://github.com/remy/nodemon) to run the server, `server.js` and watch for changes in the server file. If `nodemon` sees changes it reloads the server.
## Running `make`
`./runtributary` uses `nodemon` to run `make` and to watch for changes in the `src` directory. If there are changes, it reruns `make`.
## Reloading the current page
The last step in the `make` is to touch the file `static/reload/README.md`

The server uses [`livereload`]((https://github.com/napcs/node-livereload)) to watch the `static/reload` directory for changes. When it sees the change caused by `make`, it sends a message to any livereload plugins to tell them to reload the current URL.


