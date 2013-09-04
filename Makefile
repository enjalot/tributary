# See the README for installation instructions.

NODE_PATH ?= ./node_modules
JS_COMPILER = $(NODE_PATH)/uglify-js/bin/uglifyjs
JS_BEAUTIFIER = $(NODE_PATH)/uglify-js/bin/uglifyjs -b -i 2 -nm -ns
BROWSERIFY = $(NODE_PATH)/.bin/browserify
HANDLEBARS_COMPILER = $(NODE_PATH)/handlebars/bin/handlebars
LESS_COMPILER = $(NODE_PATH)/less/bin/lessc
JS_TESTER = $(NODE_PATH)/vows/bin/vows
LOCALE ?= en_US

all: \
	tributary.js \
	tributary.min.js \
	tributary-ui.js \
	tributary-ui.min.js \
	handlebars \
	less

# Modify this rule to build your own custom release.

.INTERMEDIATE tributary.js: \
	src/start.js \
	src/core.js \
	src/util.js \
	src/code.js \
	src/config.js \
	src/context.js \
	src/editor.js \
	src/gist.js \
	src/batch.js \
	src/plugin.js \
	src/end.js
	
UI = \
	src/ui/start.js \
  src/ui/ui.js \
	src/ui/files.js \
	src/ui/end.js

#THIRD_PARTY = \
	#static/lib/three.min.js \
	#static/lib/Stats.js
	#static/lib/jsonlint.js
	

test: all
	@$(JS_TESTER)

%.min.js: %.js Makefile
	@rm -f static/$@
	#$(JS_COMPILER) < static/$< > static/$@
	#browserify -x $(THIRD_PARTY) static/tributary.js -o static/tributary.min.js
	$(BROWSERIFY) static/$< -o static/$@

tributary.js: Makefile
	@rm -f static/$@
	cat $(filter %.js,$^) | $(JS_BEAUTIFIER) > static/$@
	@chmod a-w static/$@
	
tributary-ui.js: Makefile
	@rm -f static/$@
	cat $(UI) | $(JS_BEAUTIFIER) > static/$@
	@chmod a-w static/$@


handlebars: Makefile
	$(HANDLEBARS_COMPILER) static/templates/* > static/templates.js
	$(HANDLEBARS_COMPILER) templates/*.handlebars > templates/server-templates.js
	$(HANDLEBARS_COMPILER) sandbox/templates/*.handlebars > sandbox/templates/sandbox-templates.js

less: Makefile
	$(LESS_COMPILER)  static/css/less/style.less > static/css/style.css 
	$(LESS_COMPILER)  static/css/less/header.less > static/css/header.css 

clean:
	rm -f static/tributary*.js
