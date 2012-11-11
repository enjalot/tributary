(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['config'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, self=this;

function program1(depth0,data) {
  
  
  return "\n\n  ";}

function program3(depth0,data) {
  
  
  return "\n\n  ";}

function program5(depth0,data) {
  
  
  return "\n    \n  ";}

  buffer += "<div class=displaycontrols>\n  <span class=config_title>Display:</span>\n  ";
  stack1 = depth0.displays;
  stack1 = helpers.each.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>\n\n<div class=timecontrols>\n  <span class=config_title>Time Controls:</span>\n  ";
  stack1 = depth0.timecontrols;
  stack1 = helpers.each.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(3, program3, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>\n\n<div class=\"requirecontrols\">\n  <span class=config_title>External Scripts:</span>\n  ";
  stack1 = depth0.timecontrols;
  stack1 = helpers.each.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(5, program5, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>\n\n\n\n";
  return buffer;});
templates['editor'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  


  return "<div class=\"tb_editortopbar\">\n</div>\n\n<div class=\"tb_editor\">\n</div>\n\n\n\n";});
templates['files'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n  <div class=fv data-filename=";
  stack1 = depth0.filename;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + ">  \n      ";
  stack1 = depth0.filename;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\n  </div>\n";
  return buffer;}

  stack1 = depth0.contexts;
  stack1 = helpers.each.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n<div class=\"plus\">\n    + <input type=text style=display:none></input>\n</div>\n \n\n";
  return buffer;});
templates['hello'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"entry\">\n  <h1>";
  foundHelper = helpers.title;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</h1>\n  <div class=\"body\">\n    ";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\n  </div>\n</div>\n";
  return buffer;});
templates['panel'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  


  return "<div class=\"tb_paneltopbar\">\n  <div class=\"tb_panelfiles_gui\">\n    <div class=\"tb_files\">\n    </div>\n  </div>\n</div>\n\n<div class=\"tb_edit panel\">\n</div>\n\n<div class=\"tb_config panel\">\n</div>\n\n<div class=\"tb_panelbottombar\">\n  <div class=\"tb_panel_gui\">\n      <span class=\"tb_hide-panel\">\n        <button class=\"tb_hide-panel-button\">X</button>\n      </span>\n  </div>\n</div>\n\n";});
})();
