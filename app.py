from flask import Flask, render_template, request, make_response
import urllib2
from urllib2 import URLError, HTTPError
import json

app = Flask(__name__)
app.debug = True

base_url = "/"

#We assume a default filename of inlet.js to grab from the gist
default_filename = "inlet.js"

@app.route("/")
def hello():
    #return render_template("index.html", base_url=base_url)
    return render_template("gallery.html", base_url=base_url)


#Live editing d3 for exploring parameter spaces
@app.route("/tributary/")
@app.route("/tributary/<gist>/")
def tributary_gist(gist=None):
    return render_template("tributary.html", gist=gist, filename=default_filename, base_url=base_url) 

#Live editing transitions
@app.route("/delta/")
@app.route("/delta/<gist>/")
def delta_gist(gist=None):
    return render_template("delta.html", gist=gist, filename=default_filename, base_url=base_url) 

#Live editing run loops
@app.route("/hourglass/")
@app.route("/hourglass/<gist>/")
def hourglass_gist(gist=None):
    return render_template("hourglass.html", gist=gist, filename=default_filename, base_url=base_url) 

#Live editing music visualization
@app.route("/flow/")
@app.route("/flow/<gist>/")
def flow_gist(gist=None):
    return render_template("flow.html", gist=gist, filename=default_filename, base_url=base_url) 

#Experimenting with tiling and patterns
@app.route("/reptile/")
@app.route("/reptile/<gist>/")
def reptile_gist(gist=None):
    return render_template("reptile.html", gist=gist, filename=default_filename, base_url=base_url) 


#Embedded view for Tributary
@app.route("/embed/<gist>/")
def embed_gist(gist=None):
    return render_template("embed.html", gist=gist, filename=default_filename, base_url=base_url) 

#Embedded view for Delta
@app.route("/shore/<gist>/")
def shore_gist(gist=None):
    return render_template("shore.html", gist=gist, filename=default_filename, base_url=base_url) 


#@app.route("/tributary/api/<gist>/<filename>")
@app.route("/tributary/api/<gist>/")
def internal_gist(gist, filename=None):
    code = ""

    if filename is None:
        filename = default_filename

    #print gist, filename
    url = "https://raw.github.com/gist/" #1569370/boid.js
    url += gist + "/" + filename
    #print "url", url

    req = urllib2.Request(url)
    try:
        obj = urllib2.urlopen(req)
        code = obj.read()
    except URLError, e:
        print "ERROR", e.code
    return code


#Save a tributary to a gist
@app.route("/tributary/save", methods=["POST"])
def save():
    data = request.values.get("gist")

    #TODO: use github auth for logged in users
    url = 'https://api.github.com/gists'
    req = urllib2.Request(url, data)
    ret = urllib2.urlopen(req).read()
    #print "ret", ret
    resp = make_response(ret, 200)
    resp.headers['Content-Type'] = 'application/json'

    return resp


#An experimental view that allowed creating screenshots from the gallery
@app.route("/creator")
def creator():
    return render_template("gallery_creator.html", base_url=base_url)

#EXPIREMENTAL: these don't work with the rewrite, will need to be resurrected
"""
@app.route("/geyser/<gist>/<filename>")
def geyser_gist(gist=None, filename=None):
    return render_template("geyser.html", gist=gist, filename=default_filename, base_url=base_url) 

@app.route("/fountain/<gist>/<filename>")
def fountain_gist(gist=None, filename=None):
    return render_template("fountain.html", gist=gist, filename=default_filename, base_url=base_url) 

@app.route("/carbonite/<gist>/<filename>")
def carbonite_gist(gist=None, filename=None):
    return render_template("carbonite.html", gist=gist, filename=default_filename, base_url=base_url) 
"""



if __name__ == "__main__":
    app.run(host="localhost", port=8888)
