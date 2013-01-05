# See the README for installation instructions.

NODE_PATH ?= ./node_modules
JS_COMPILER = $(NODE_PATH)/uglify-js/bin/uglifyjs
JS_BEAUTIFIER = $(NODE_PATH)/uglify-js/bin/uglifyjs -b -i 2 -nm -ns
HANDLEBARS_COMPILER = $(NODE_PATH)/handlebars/bin/handlebars
LESS_COMPILER = $(NODE_PATH)/less/bin/lessc
JS_TESTER = $(NODE_PATH)/vows/bin/vows
LOCALE ?= en_US

all: \
	tributary.js \
	tributary.min.js \
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
	src/panel.js \
	src/editor.js \
	src/gist.js \
	src/files.js \
	src/controls.js \
	src/batch.js \
	src/ui.js \
	src/end.js


test: all
	@$(JS_TESTER)

%.min.js: %.js Makefile
	@rm -f static/$@
	$(JS_COMPILER) < static/$< > static/$@

tributary.js: Makefile
	@rm -f static/$@
	cat $(filter %.js,$^) | $(JS_BEAUTIFIER) > static/$@
	@chmod a-w static/$@

handlebars: Makefile
	$(HANDLEBARS_COMPILER) static/templates/* > static/templates.js
	$(HANDLEBARS_COMPILER) templates/*.handlebars > templates/server-templates.js

less: Makefile
	$(LESS_COMPILER)  static/css/style.less > static/css/style.css 

clean:
	rm -f static/tributary*.js
