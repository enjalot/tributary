(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['config'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n    <div class=config data-name="
    + escapeExpression(((stack1 = depth0.name),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ">\n      <span>"
    + escapeExpression(((stack1 = depth0.name),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n      <span class=description>"
    + escapeExpression(((stack1 = depth0.description),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n    </div>\n  ";
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n    <div class=config data-name="
    + escapeExpression(((stack1 = depth0.name),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " data-url="
    + escapeExpression(((stack1 = depth0.url),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ">\n      <span>"
    + escapeExpression(((stack1 = depth0.name),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n      <span class=description> "
    + escapeExpression(((stack1 = depth0.url),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n      <span class=delete>x</span>\n    </div>\n  ";
  return buffer;
  }

  buffer += "<div class=displaycontrols>\n  <span class=config_title>Display:</span>\n  ";
  stack1 = helpers.each.call(depth0, depth0.displays, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>\n\n<div class=timecontrols>\n  <span class=config_title>Time Controls:</span>\n  ";
  stack1 = helpers.each.call(depth0, depth0.time_controls, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>\n\n<div class=\"editorcontrols\">\n  <span class=\"config_title\">Editor Controls:</span>\n    <div class=\"config\" data-name=\"log-errors\">\n      <span>Log errors</span>\n      <span class=\"description\">Show JSHint errors in the console</span>\n    </div>\n</div>\n\n<div class=\"requirecontrols\">\n  <div class=config_title>External Scripts:</div>\n  ";
  stack1 = helpers.each.call(depth0, depth0.requires, {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  <div class=\"plus\">\n    +\n  </div>\n\n  <div class=\"tb_add\" style=\"display:none;\">\n    <div>name: <input type=text class=\"name\"></input></div>\n    <div>url: <input type=text class=\"url\"></input></div>\n  </div>\n\n\n</div>\n\n\n\n";
  return buffer;
  });
templates['editor'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, self=this;

function program1(depth0,data) {
  
  
  return "checked";
  }

  buffer += "<!--\n<div class=\"toolbar hidden\">\n  <label>default<input type=\"radio\" class=\"radio\" name=\"editmode\" value=\"default\" ";
  stack1 = helpers['if'].call(depth0, depth0['default'], {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "></input></label>\n  <label>vim<input type=\"radio\" class=\"radio\" name=\"editmode\" value=\"vim\" ";
  stack1 = helpers['if'].call(depth0, depth0.vim, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "></input></label>\n  <label>emacs<input type=\"radio\" class=\"radio\" name=\"editmode\" value=\"emacs\" ";
  stack1 = helpers['if'].call(depth0, depth0.emacs, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "></input></label>\n\n  <label class=\"fontSize\">Font Size:<label class='plusFontSize'>+</label><label class='minusFontSize'>-</label></label>\n</div>\n\n<div class=\"settings\">\n<img src=\"/static/img/settings@2x.png\" style=\"width: 14px; height: 14px;\" />\n</div>\n-->\n";
  return buffer;
  });
templates['files'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n  <li class=\"file filetype-"
    + escapeExpression(((stack1 = depth0.type),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" data-filename="
    + escapeExpression(((stack1 = depth0.filename),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ">\n      "
    + escapeExpression(((stack1 = depth0.filename),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\n\n    <i class=\"icon-cancel delete-file\"></i>\n  </li>\n";
  return buffer;
  }

  stack1 = helpers.each.call(depth0, depth0.contexts, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<li class=\"add-file\"> \n  + \n  <input type=text style=\"display:none;\"></input>\n</li>\n\n\n";
  return buffer;
  });
templates['panel'] = template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "";
  buffer += "\n        <div class=\"pb\" id="
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "_tab data-name="
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + ">"
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "</div>\n      ";
  return buffer;
  }

  buffer += "<div class=\"tb_paneltopbar\">\n  <div class=\"tb_panelfiles_gui\">\n    <div class=\"tb_files\">\n    </div>\n  </div>\n</div>\n\n<div class=\"tb_edit panel\">\n</div>\n\n<div class=\"tb_config panel\">\n</div>\n\n<div class=\"tb_panelbottombar\">\n  <div class=\"tb_panel_gui\">\n      <span class=\"tb_hide-panel\">\n        <button class=\"tb_hide-panel-button\">X</button>\n      </span>\n      ";
  stack1 = helpers.each.call(depth0, depth0, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </div>\n</div>\n\n";
  return buffer;
  });
})();
