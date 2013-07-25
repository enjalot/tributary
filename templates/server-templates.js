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
  buffer += escapeExpression(stack1) + "\");\n    //header.userurl = \"";
  stack1 = depth0.user;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.html_url;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\";\n    header.userurl = \"http://tributary.io/inlet/5860371?user=";
  stack1 = depth0.user;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.login;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\";\n    header.origin = \"";
  foundHelper = helpers.sandboxOrigin;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.sandboxOrigin; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\";\n    header.query = ";
  foundHelper = helpers.query;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.query; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ";\n    \n    \n    $('i').tipsy({fade: true, gravity: 'n', opacity: 0.86});\n  </script>\n\n\n  <!-- header.js sets up the header and does communication with child iframe -->\n  <script src='/static/header.js?v=0.8'></script>\n\n</body>\n</html>\n\n\n";
  return buffer;});
templates['headerShare'] = template(function (Handlebars,depth0,helpers,partials,data) {
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
  buffer += escapeExpression(stack1) + "</span></span>\n      <button id=\"loginPanel\">Log out</button>\n      ";
  return buffer;}

function program3(depth0,data) {
  
  
  return "\n      <button id=\"loginPanel\">Log in <i class=\"icon-github\"></i></button>\n      ";}

  buffer += "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\"/>\n  <title>Tributary</title>\n  <!-- Place favicon.ico and apple-touch-icon.png in the root of your domain and delete these references\n  <link rel=\"shortcut icon\" href=\"/favicon.ico\">\n  -->\n  <link rel=\"icon\"\n    type=\"image/png\"\n    href=\"/static/img/favicon.32.png\" />\n  <link rel=\"shortcut icon\" href=\"/static/img/favicon.ico\">\n\n  <!--[if lt IE 9]>\n    <script src=\"http://html5shim.googlecode.com/svn/trunk/html5.js\"></script>\n  <![endif]-->\n  <link rel=\"stylesheet\" media=\"all\" href=\"\"/>\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>\n  <!-- Adding \"maximum-scale=1\" fixes the Mobile Safari auto-zoom bug: http://filamentgroup.com/examples/iosScaleBug/ -->\n\n  <!-- TODO: separate out tributary ui styling from header styling? some of it overlaps -->\n  <link rel=\"stylesheet\" href=\"/static/css/trib.css\">\n  <link rel=\"stylesheet\" href=\"/static/css/animation.css\">\n  <link href='http://fonts.googleapis.com/css?family=Ubuntu+Mono:400,700,400italic,700italic' rel='stylesheet' type='text/css'>\n  <link rel=\"stylesheet\" href=\"/static/css/tipsy.css\">\n  <link rel='stylesheet' type='text/css' href='http://yui.yahooapis.com/2.9.0/build/reset/reset-min.css' />\n\n  <!-- And the main styles -->\n  <link rel=\"stylesheet\" href=\"/static/css/header.css\" type=\"text/css\" media=\"screen\" title=\"Primary Stylesheet\" charset=\"utf-8\">\n\n\n\n  <!-- Add jQuery -->\n  <script src=\"/static/lib/jquery-1.7.min.js\"></script>\n  \n\n\n  <script type=\"text/javascript\">\n      var _gaq = _gaq || [];\n      _gaq.push(['_setAccount', 'UA-30237258-1']);\n      _gaq.push(['_trackPageview']);\n\n      (function() {\n          var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;\n          ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';\n          var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);\n      })();\n  </script>\n\n</head>\n<body>\n<div id=\"container\">\n  <header id=\"title\">\n  <h1>\n    <a href=\"/inlet/\" target=\"_blank\">Tributary</a>\n    <small><a href=\"/\" target=\"_blank\"><i title=\"Tributary home page\" class=\"explain-this-shit icon-help-circled\"></i></a></small>\n  </h1>\n\n    <section id=\"inlet-info\">\n      <input id=\"gist-title\" val=\"";
  foundHelper = helpers.title;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">\n      <span id=\"author-avatar\"> by <img class=\"avatar\"/></span>\n      <span id=\"inlet-author\">";
  foundHelper = helpers.author;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.author; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</span>\n\n      <!--\n      <button id=\"save\" title=\"Save current state\" onclick='$(\".icon-load\").css(\"opacity\", 1);'>Save</button>\n      <button id=\"fork\" title=\"Save a copy\" style=\"display:none;\">Fork</button>\n      <i class=\"icon-load animate-spin\" style=\"opacity: 0;\"></i>\n      -->\n    </section>\n\n    <!--\n    <section id=\"login\">\n      ";
  stack1 = depth0.loggedin;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      \n      <button id=\"exit-fullscreen\" style=\"display: none;\">Exit fullscreen</button>\n\n    </section>\n    -->\n\n  </header>\n\n  <iframe id=\"sandbox\" src=\"";
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
  buffer += escapeExpression(stack1) + "\");\n    //header.userurl = \"";
  stack1 = depth0.user;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.html_url;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\";\n    header.userurl = \"http://tributary.io/inlet/5860371?user=";
  stack1 = depth0.user;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.login;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\";\n    header.origin = \"";
  foundHelper = helpers.sandboxOrigin;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.sandboxOrigin; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\";\n    header.query = ";
  foundHelper = helpers.query;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.query; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ";\n    header.fullscreen = true;\n    \n    \n    $('i').tipsy({fade: true, gravity: 'n', opacity: 0.86});\n  </script>\n\n\n  <!-- header.js sets up the header and does communication with child iframe -->\n  <script src='/static/header.js?v=0.8'></script>\n\n</body>\n</html>\n\n\n";
  return buffer;});
})();
