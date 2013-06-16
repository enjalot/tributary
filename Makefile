
all: \
	browserify	
	
browserify:
	browserify src/tributary.js -o tributary.js
