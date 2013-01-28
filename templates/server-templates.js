(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['header'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n      <span id=\"current-user\"><span class=\"user-avatar\"><img id=\"user-avatar\" class=\"avatar\" src=\"";
  foundHelper = helpers.avatar_url;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.avatar_url; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"/></span><span id=\"current-username\">";
  stack1 = depth0.user;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</span></span>\n			<button id=\"loginPanel\">Log out</button>\n      ";
  return buffer;}

function program3(depth0,data) {
  
  
  return "\n      <button id=\"loginPanel\">Log in <i class=\"icon-github\"></i></button>\n      ";}

  buffer += "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n	<meta charset=\"utf-8\"/>\n	<title>Tributary</title>\n	<!-- Place favicon.ico and apple-touch-icon.png in the root of your domain and delete these references\n	<link rel=\"shortcut icon\" href=\"/favicon.ico\">\n  -->\n  <link rel=\"icon\"\n    type=\"image/png\"\n    href=\"/static/img/favicon.32.png\" />\n  <link rel=\"shortcut icon\" href=\"/static/img/favicon.ico\">\n\n	<!--[if lt IE 9]>\n		<script src=\"http://html5shim.googlecode.com/svn/trunk/html5.js\"></script>\n	<![endif]-->\n	<link rel=\"stylesheet\" media=\"all\" href=\"\"/>\n	<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>\n	<!-- Adding \"maximum-scale=1\" fixes the Mobile Safari auto-zoom bug: http://filamentgroup.com/examples/iosScaleBug/ -->\n\n  <!-- TODO: separate out tributary ui styling from header styling? some of it overlaps -->\n  <link rel=\"stylesheet\" href=\"/static/css/trib.css\">\n  <link rel=\"stylesheet\" href=\"/static/css/animation.css\">\n  <link href='http://fonts.googleapis.com/css?family=Ubuntu+Mono:400,700,400italic,700italic' rel='stylesheet' type='text/css'>\n  <link rel=\"stylesheet\" href=\"/static/css/tipsy.css\">\n  <link rel='stylesheet' type='text/css' href='http://yui.yahooapis.com/2.9.0/build/reset/reset-min.css' />\n\n  <!-- And the main styles -->\n  <link rel=\"stylesheet\" href=\"/static/css/header.css\" type=\"text/css\" media=\"screen\" title=\"Primary Stylesheet\" charset=\"utf-8\">\n\n\n\n  <!-- Add jQuery -->\n  <script src=\"/static/lib/jquery-1.7.min.js\"></script>\n  \n\n\n  <script type=\"text/javascript\">\n      var _gaq = _gaq || [];\n      _gaq.push(['_setAccount', 'UA-30237258-1']);\n      _gaq.push(['_trackPageview']);\n\n      (function() {\n          var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;\n          ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';\n          var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);\n      })();\n  </script>\n\n</head>\n<body>\n<div id=\"container\">\n	<header id=\"title\">\n  <h1>\n    <a href=\"/inlet/\" target=\"_blank\">Tributary</a>\n    <small><a href=\"/\" target=\"_blank\"><i title=\"Tributary home page\" class=\"explain-this-shit icon-help-circled\"></i></a></small>\n  </h1>\n\n		<section id=\"inlet-info\">\n			<input id=\"gist-title\" val=\"";
  foundHelper = helpers.title;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">\n			<span id=\"author-avatar\"> by <img class=\"avatar\"/></span>\n			<span id=\"inlet-author\">";
  foundHelper = helpers.author;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.author; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</span>\n\n\n			<button id=\"save\" title=\"Save current state\" onclick='$(\".icon-load\").css(\"opacity\", 1);'>Save</button>\n			<button id=\"fork\" title=\"Save a copy\" style=\"display:none;\">Fork</button>\n\n			<!-- Export one day <button id=\"export\"><i class=\"icon-export\"></i></button> -->\n\n			<i class=\"icon-load animate-spin\" style=\"opacity: 0;\"></i>\n		</section>\n\n\n\n		<section id=\"login\">\n			";
  stack1 = depth0.loggedin;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      \n      <button id=\"exit-fullscreen\" style=\"display: none;\">Exit fullscreen</button>\n\n		</section>\n\n	</header>\n\n  <iframe id=\"sandbox\" src=\"";
  foundHelper = helpers.sandboxOrigin;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.sandboxOrigin; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\" frameBorder=0></iframe>\n\n  <!-- Essential 3rd party libraries -->\n  <script src=\"/static/lib/d3.min.js\"></script>\n  <script src=\"/static/lib/underscore-min.js\"></script>\n  <script src=\"/static/lib/handlebars-1.0.rc.1.js\"></script>\n  \n  <script src=\"/static/lib/jquery.tipsy.js\" type=\"text/javascript\" charset=\"utf-8\"></script>\n  <script src=\"/static/templates.js\"></script>\n\n  <script>\n    //TODO: lets not make these globals;\n    var header = {};\n    header.gistid = \"";
  foundHelper = helpers.gistid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.gistid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\";\n    header.loggedin = \"";
  foundHelper = helpers.loggedin;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.loggedin; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\";\n    header.username = \"";
  stack1 = depth0.user;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.login;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\";\n    header.avatar = \"";
  stack1 = depth0.user;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.avatar_url;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\";\n    header.userid = parseInt(\"";
  stack1 = depth0.user;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.id;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\");\n    header.userurl = \"";
  stack1 = depth0.user;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.html_url;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\";\n    header.origin = \"";
  foundHelper = helpers.sandboxOrigin;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.sandboxOrigin; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\";\n  </script>\n\n\n  <!-- header.js sets up the header and does communication with child iframe -->\n  <script src='/static/header.js?v=0.8'></script>\n\n</body>\n</html>\n\n\n";
  return buffer;});
templates['inlet'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n      <span id=\"current-user\"><span class=\"user-avatar\"><img id=\"user-avatar\" class=\"avatar\" src=\"";
  foundHelper = helpers.avatar_url;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.avatar_url; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"/></span><span id=\"current-username\">";
  stack1 = depth0.user;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</span></span>\n			<button id=\"loginPanel\">Log out</button>\n      ";
  return buffer;}

function program3(depth0,data) {
  
  
  return "\n      <button id=\"loginPanel\">Log in <i class=\"icon-github\"></i></button>\n      ";}

  buffer += "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n	<meta charset=\"utf-8\"/>\n	<title>Tributary</title>\n	<!-- Place favicon.ico and apple-touch-icon.png in the root of your domain and delete these references\n	<link rel=\"shortcut icon\" href=\"/favicon.ico\">\n  -->\n  <link rel=\"icon\"\n    type=\"image/png\"\n    href=\"/static/img/favicon.32.png\" />\n  <link rel=\"shortcut icon\" href=\"/static/img/favicon.ico\">\n\n	<!--[if lt IE 9]>\n		<script src=\"http://html5shim.googlecode.com/svn/trunk/html5.js\"></script>\n	<![endif]-->\n	<link rel=\"stylesheet\" media=\"all\" href=\"\"/>\n	<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>\n	<!-- Adding \"maximum-scale=1\" fixes the Mobile Safari auto-zoom bug: http://filamentgroup.com/examples/iosScaleBug/ -->\n\n  <link rel=\"stylesheet\" href=\"/static/css/trib.css\">\n  <link rel=\"stylesheet\" href=\"/static/css/animation.css\">\n  <link href='http://fonts.googleapis.com/css?family=Ubuntu+Mono:400,700,400italic,700italic' rel='stylesheet' type='text/css'>\n  <link rel=\"stylesheet\" href=\"/static/css/tipsy.css\">\n\n  <!-- Add jQuery -->\n  <script src=\"/static/lib/jquery-1.7.min.js\"></script>\n\n\n  <script type=\"text/javascript\">\n      var _gaq = _gaq || [];\n      _gaq.push(['_setAccount', 'UA-30237258-1']);\n      _gaq.push(['_trackPageview']);\n\n      (function() {\n          var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;\n          ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';\n          var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);\n      })();\n  </script>\n\n\n  <!-- CodeMirror Things -->\n<link rel=\"stylesheet\" href=\"/static/lib/CodeMirror3/lib/codemirror.css\">\n<link rel=\"stylesheet\" href=\"/static/lib/CodeMirror3/lib/util/dialog.css\">\n<link rel=\"stylesheet\" href=\"/static/lib/CodeMirror3/theme/night.css\">\n<link rel=\"stylesheet\" href=\"/static/lib/CodeMirror3/theme/vibrant-ink.css\">\n<link rel=\"stylesheet\" href=\"/static/lib/CodeMirror3/theme/ambiance.css\">\n<link rel=\"stylesheet\" href=\"/static/lib/CodeMirror3/theme/elegant.css\">\n\n<!-- Add EJ modified lesser dark -->\n<link rel=\"stylesheet\" href=\"/static/lib/CodeMirror3/theme/ej.css\">\n\n\n<link rel='stylesheet' type='text/css' href='http://yui.yahooapis.com/2.9.0/build/reset/reset-min.css' />\n<link rel='stylesheet' type='text/css' href='/static/lib/slider/css/humanity/jquery-ui-slider.css' />\n<link href=\"/static/lib/colorpicker/Color.Picker.Classic.css\" rel=\"stylesheet\" type=\"text/css\" />\n\n\n\n<!-- And the main styles -->\n<link rel=\"stylesheet\" href=\"/static/css/style.css\" type=\"text/css\" media=\"screen\" title=\"Primary Stylesheet\" charset=\"utf-8\">\n\n\n</head>\n<body>\n<div id=\"container\">\n	<header id=\"title\">\n  <h1>\n    <a href=\"/inlet/\" target=\"_blank\">Tributary</a>\n    <small><a href=\"/\" target=\"_blank\"><i title=\"Tributary home page\" class=\"explain-this-shit icon-help-circled\"></i></a></small>\n  </h1>\n\n		<section id=\"inlet-info\">\n			<input id=\"gist-title\" val=\"";
  foundHelper = helpers.title;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">\n			<span id=\"author-avatar\"> by <img class=\"avatar\"/></span>\n			<span id=\"inlet-author\">";
  foundHelper = helpers.author;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.author; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</span>\n\n\n			<button id=\"save\" title=\"Save current state\" onclick='$(\".icon-load\").css(\"opacity\", 1);'>Save</button>\n			<button id=\"fork\" title=\"Save a copy\" style=\"display:none;\">Fork</button>\n\n			<!-- Export one day <button id=\"export\"><i class=\"icon-export\"></i></button> -->\n\n			<i class=\"icon-load animate-spin\" style=\"opacity: 0;\"></i>\n		</section>\n\n\n\n		<section id=\"login\">\n			";
  stack1 = depth0.loggedin;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n      	<button id=\"exit-fullscreen\" style=\"display: none;\">Exit fullscreen</button>\n\n		</section>\n\n	</header>\n\n	<section id=\"display\">\n\n	</section>\n\n	<aside id=\"panel\">\n		<section id=\"files\">\n			<ul id=\"file-list\">\n			</ul>\n		</section>\n\n		<section id=\"config\" >\n			<button id=\"config-toggle\">Config</button>\n			<button id=\"library-toggle\">Add libraries</button>\n			<button id=\"fullscreen\">Fullscreen</button>\n\n\n			<div id=\"config-content\" class=\"config-content\" style=\"display: none;\">\n				<h4>Display <small><i class=\"explain-this-shit icon-help-circled\"></i></small></h4>\n				<select>\n					<option value=\"svg\">SVG</option>\n					<option value=\"canvas\">Canvas</option>\n					<option value=\"webgl\">WebGL</option>\n					<option value=\"div\">HTML</option>\n				</select>\n\n        <div id=\"timecontrols\">\n          <h4>Time Controls <small><i class=\"explain-this-shit icon-help-circled\"></i></small></h4>\n          <button id=\"play\" data-name=\"play\">Play</button>\n          <button id=\"loop\" data-name=\"loop\">Loop</button>\n          <button id=\"restart\" data-name=\"restart\">Restart</button>\n        </div>\n\n        <div id=\"editorcontrols\">\n          <h4>Editor Controls <small><i class=\"explain-this-shit icon-help-circled\"></i></small></h4>\n          <button id=\"logerrors\" data-name=\"log-errors\">Log Errors</button>\n        </div>\n\n        <div id=\"thumbnail-content\">\n          <h4>Add thumbnail <small><i class=\"explain-this-shit icon-help-circled\"></i></small></h4>\n          <img id=\"trib-thumbnail\" style=\"display:none;\"></img>\n          <input type=\"file\" name=\"files[]\" />\n        </div>\n\n			</div>\n\n				<div id=\"library-content\" class=\"config-content\" style=\"display: none;\">\n					<ul id=\"library-checklist\">\n          <!--\n					<li class=\"lib\"> <input type=\"checkbox\" /> Tabletop </li>\n					<li class=\"lib\"> <input type=\"checkbox\" /> Paper.js </li>\n					<li class=\"lib\"> <input type=\"checkbox\" /> Kartogram </li>\n					<li class=\"lib\"> <input type=\"checkbox\" /> TopoJSON </li>\n          -->\n					</ul>\n					<h4>Import URL</h4>\n					<ul id=\"library-links\">\n						<li class=\"add-link\">Title: <input type=\"text\" class=\"library-title\"> URL: <input type=\"text\" class=\"library-url\">\n						<button class=\"add-library\">Add</button>\n						</li>\n					</ul>\n				</div>\n\n		</section>\n		<section id=\"code\">\n\n		</section>\n\n    <section id=\"controls\">\n    </section>\n\n	</aside>\n\n</div>\n\n\n\n\n\n\n<!-- Essential 3rd party libraries -->\n<script src=\"/static/lib/d3.min.js\"></script>\n<script src=\"/static/lib/underscore-min.js\"></script>\n<script src=\"/static/lib/underscore.math.js\"></script>\n<script src=\"/static/lib/backbone-min.js\"></script>\n<script src=\"/static/lib/coffee-script.js\"></script>\n<script src=\"/static/lib/require.js\"></script>\n<script src='/static/lib/three.min.js'></script>\n<script src=\"/static/lib/Stats.js\"></script>\n<script src=\"/static/lib/jshint.js\"></script>\n<script src=\"/static/lib/handlebars-1.0.rc.1.js\"></script>\n\n\n\n<!-- CodeMirror -->\n<script src=\"/static/lib/CodeMirror3/lib/codemirror.js\"></script>\n<script src=\"/static/lib/CodeMirror3/lib/util/searchcursor.js\"></script>\n<script src=\"/static/lib/CodeMirror3/lib/util/search.js\"></script>\n<script src=\"/static/lib/CodeMirror3/lib/util/dialog.js\"></script>\n<script src=\"/static/lib/CodeMirror3/lib/util/runmode.js\"></script>\n\n<script src=\"/static/lib/CodeMirror3/mode/javascript/javascript.js\"></script>\n<script src=\"/static/lib/CodeMirror3/mode/css/css.js\"></script>\n<script src=\"/static/lib/CodeMirror3/mode/xml/xml.js\"></script>\n<script src=\"/static/lib/CodeMirror3/mode/htmlmixed/htmlmixed.js\"></script>\n<script src=\"/static/lib/CodeMirror3/mode/coffeescript/coffeescript.js\"></script>\n<script src=\"/static/lib/CodeMirror3/keymap/vim.js\"></script>\n<script src=\"/static/lib/CodeMirror3/keymap/emacs.js\"></script>\n\n<!-- UI components TODO: replace with pure d3 -->\n<script src=\"/static/lib/jquery-ui.1.8.16.custom.min.js\"></script>\n<script src='/static/lib/slider/js/jquery.ui.slider.js'></script>\n<script src=\"/static/lib/jquery.tipsy.js\" type=\"text/javascript\" charset=\"utf-8\"></script>\n\n<!-- https://github.com/mudcube/Color-Picker -->\n<script src=\"/static/lib/colorpicker/Color.Picker.Classic.js\" type=\"text/javascript\"></script>\n<script src=\"/static/lib/colorpicker/Color.Space.js\" type=\"text/javascript\"></script>\n<script src=\"/static/lib/dat.gui.min.js\"></script>\n\n<!-- Tributary -->\n<script src=\"/static/templates.js\"></script>\n<script src=\"/static/lib/inlet.js\"></script>\n<script src='/static/tributary.js?v=0.8'></script>\n\n<script type=\"text/javascript\">\n    var tb = Tributary();\n    //provide global trib object\n    tb.loggedin = \"";
  foundHelper = helpers.loggedin;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.loggedin; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\";\n    tb.username = \"";
  stack1 = depth0.user;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.login;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\";\n    tb.avatar = \"";
  stack1 = depth0.user;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.avatar_url;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\";\n    tb.userid = parseInt(\"";
  stack1 = depth0.user;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.id;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\");\n    tb.userurl = \"";
  stack1 = depth0.user;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.html_url;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\";\n</script>\n\n\n<script type=\"text/javascript\">\n\n//get rid of selection when dragging things\nif(typeof document.body.style.MozUserSelect!=\"undefined\")\n    document.body.style.MozUserSelect=\"none\";\nelse if(typeof document.body.onselectstart!=\"undefined\")\n    document.body.onselectstart=function(){return false};\nelse\n    document.body.onmousedown=function(){return false};\ndocument.body.style.cursor = \"default\";\n\n$('i').tipsy({fade: true, gravity: 'n', opacity: 0.86});\n\n//TODO: for old endpoints do:\n//tb.endpoint = \"delta\";\n\ntb.ui.setup();\n//assemble the UI\ntb.ui.assemble(\"";
  foundHelper = helpers.gistid;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.gistid; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\");\n\n</script>\n\n\n\n\n\n</body>\n</html>\n";
  return buffer;});
})();
