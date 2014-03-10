We want to allow people to develop using d3.json, d3.csv, d3.xml etc  
The problem is that the default behavior of tributary is to rerun the code
every keystroke. This can cause lag when the ajax calls get spammed.  

This plugin will cache the results based on the last URL executed. This should cover
the default behavior people expect. It could cause a problem if you want to programmatically
refresh data from the same URL, but there is an option to turn off the ajax caching added to the config.
