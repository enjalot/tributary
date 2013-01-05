(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['inlet'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n            <a href=\"http://github.com/";
  foundHelper = helpers.username;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.username; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  stack1 = depth0.user;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.login;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a>\n            <button id='loginPanel' class=\"button_on\"> Logout </button>\n          ";
  return buffer;}

function program3(depth0,data) {
  
  
  return "\n            anon\n            <button id='loginPanel' class=\"button_on\"> Login </button>\n          ";}

  buffer += "<!doctype html>\n<html>\n<head>\n    <meta charset='utf-8' />\n\n    <link rel=\"icon\"\n          type=\"image/png\"\n          href=\"/static/img/favicon.32.png\" />\n\n    <title>Tributary</title>\n\n    <link href='http://fonts.googleapis.com/css?family=Ubuntu:400,700' rel='stylesheet' type='text/css'>\n    <link rel=\"stylesheet\" href=\"/static/lib/CodeMirror3/lib/codemirror.css\">\n    <link rel=\"stylesheet\" href=\"/static/lib/CodeMirror3/lib/util/dialog.css\">\n    <link rel=\"stylesheet\" href=\"/static/lib/CodeMirror3/theme/night.css\">\n    <link rel=\"stylesheet\" href=\"/static/lib/CodeMirror3/theme/lesser-dark.css\">\n    <link rel=\"stylesheet\" href=\"/static/lib/CodeMirror3/theme/vibrant-ink.css\">\n    <link rel=\"stylesheet\" href=\"/static/lib/CodeMirror3/theme/ambiance.css\">\n    <link rel=\"stylesheet\" href=\"/static/lib/CodeMirror3/theme/elegant.css\">\n\n    <link rel='stylesheet' type='text/css' href='http://yui.yahooapis.com/2.9.0/build/reset/reset-min.css' />\n    <link rel='stylesheet' type='text/css' href='/static/lib/slider/css/humanity/jquery-ui-slider.css' />\n    <link href=\"/static/lib/colorpicker/Color.Picker.Classic.css\" rel=\"stylesheet\" type=\"text/css\" />\n\n    <link rel=\"shortcut icon\" href=\"/static/img/favicon.ico\">\n\n    <link rel='stylesheet' type='text/css' href='/static/css/style.css' />\n\n\n\n    <script type=\"text/javascript\">\n        var _gaq = _gaq || [];\n        _gaq.push(['_setAccount', 'UA-30237258-1']);\n        _gaq.push(['_trackPageview']);\n\n        (function() {\n            var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;\n            ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';\n            var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);\n        })();\n    </script>\n\n    <script id=\"tributary_loader\" type=\"text/javascript\"></script>\n    </head>\n<body>\n\n<div id='page'>\n    <div id=\"header\">\n        <div id=\"branding\">\n          <h1><a href=\"http://tributary.io\">Tributary</a></h1>\n        </div>\n         <img id=\"syncing\" src=\"/static/img/ej_long_loader.3.gif\" style=\"display: none;\"/>\n\n        <div id=\"gist_info\"></div>\n        <div id=\"save_gui\">\n          ";
  stack1 = depth0.loggedin;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n            <button id='savePanel' class=\"button_on\">\n                Save\n            </button>\n\n            <button id='forkPanel' class=\"button_on\">\n                Fork\n            </button>\n\n\n            <div id=\"show-codepanel\" style=\"display: none;\">\n                <button id=\"show-codepanel-button\" class=\"button_on\">Show Code Panel</button>\n            </div>\n\n        </div>\n\n    <br>\n    </div>\n\n    <!-- main tributary UI skeleton -->\n    <div id=\"display\">\n    </div>\n    <div class=\"tb_panel\">\n    </div>\n\n    <div class=\"tb_controls\"></div>\n    <div class=\"tb_panel_handle\"></div>\n    <div id=\"slider\"></div>\n\n</div>\n\n\n\n    <!-- Essential 3rd party libraries -->\n    <script src=\"/static/lib/d3.min.js\"></script>\n    <script src=\"/static/lib/jquery-1.7.min.js\"></script>\n    <script src=\"/static/lib/underscore-min.js\"></script>\n    <script src=\"/static/lib/underscore.math.js\"></script>\n    <script src=\"/static/lib/backbone-min.js\"></script>\n    <script src=\"/static/lib/coffee-script.js\"></script>\n    <script src=\"/static/lib/require.js\"></script>\n    <script src='/static/lib/three.min.js'></script>\n    <script src=\"/static/lib/Stats.js\"></script>\n    <script src=\"/static/lib/jshint.js\"></script>\n    <script src=\"/static/lib/handlebars-1.0.rc.1.js\"></script>\n\n\n\n    <!-- CodeMirror -->\n    <script src=\"/static/lib/CodeMirror3/lib/codemirror.js\"></script>\n    <script src=\"/static/lib/CodeMirror3/lib/util/searchcursor.js\"></script>\n    <script src=\"/static/lib/CodeMirror3/lib/util/search.js\"></script>\n    <script src=\"/static/lib/CodeMirror3/lib/util/dialog.js\"></script>\n    <script src=\"/static/lib/CodeMirror3/lib/util/runmode.js\"></script>\n\n    <script src=\"/static/lib/CodeMirror3/mode/javascript/javascript.js\"></script>\n    <script src=\"/static/lib/CodeMirror3/mode/css/css.js\"></script>\n    <script src=\"/static/lib/CodeMirror3/mode/xml/xml.js\"></script>\n    <script src=\"/static/lib/CodeMirror3/mode/htmlmixed/htmlmixed.js\"></script>\n    <script src=\"/static/lib/CodeMirror3/mode/coffeescript/coffeescript.js\"></script>\n    <script src=\"/static/lib/CodeMirror3/keymap/vim.js\"></script>\n    <script src=\"/static/lib/CodeMirror3/keymap/emacs.js\"></script>\n\n    <!-- UI components TODO: replace with pure d3 -->\n    <script src=\"/static/lib/jquery-ui.1.8.16.custom.min.js\"></script>\n    <script src='/static/lib/slider/js/jquery.ui.slider.js'></script>\n    <!-- https://github.com/mudcube/Color-Picker -->\n    <script src=\"/static/lib/colorpicker/Color.Picker.Classic.js\" type=\"text/javascript\"></script>\n    <script src=\"/static/lib/colorpicker/Color.Space.js\" type=\"text/javascript\"></script>\n    <script src=\"/static/lib/dat.gui.min.js\"></script>\n\n    <!-- Tributary -->\n    <script src=\"/static/templates.js\"></script>\n    <script src=\"/static/lib/inlet.js\"></script>\n    <script src='/static/tributary.js?v=0.7'></script>\n\n\n    <script type=\"text/javascript\">\n        var tb = Tributary();\n        //provide global trib object\n        tb.loggedin = \"";
  foundHelper = helpers.loggedin;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.loggedin; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\";\n        tb.username = \"";
  stack1 = depth0.user;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.login;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\";\n        tb.avatar = \"";
  stack1 = depth0.user;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.avatar_url;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\"; tb.userid = parseInt(\"";
  foundHelper = helpers.userid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.userid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\");\n        tb.userurl = \"";
  stack1 = depth0.user;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.html_url;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\";\n    </script>\n\n\n    <script type=\"text/javascript\">\n\n    //get rid of selection when dragging things\n    if(typeof document.body.style.MozUserSelect!=\"undefined\")\n        document.body.style.MozUserSelect=\"none\";\n    else if(typeof document.body.onselectstart!=\"undefined\")\n        document.body.onselectstart=function(){return false};\n    else\n        document.body.onmousedown=function(){return false};\n    document.body.style.cursor = \"default\";\n\n    //TODO: for old endpoints do:\n    //tb.endpoint = \"delta\";\n\n    tb.ui.setup();\n    //assemble the UI\n    tb.ui.assemble(\"";
  foundHelper = helpers.gistid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.gistid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\");\n\n    </script>\n<!--\n<script>document.write('<script src=\"http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1\"></' + 'script>')</script>\n-->\n</body>\n</html>\n";
  return buffer;});
})();
