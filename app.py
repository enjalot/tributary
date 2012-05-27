from flask import Flask, render_template, request, make_response
import urllib2
from urllib2 import URLError, HTTPError
import json

app = Flask(__name__)
app.debug = True

base_url = "/"

@app.route("/")
def hello():
    #return render_template("index.html", base_url=base_url)
    return render_template("gallery.html", base_url=base_url)

@app.route("/creator")
def creator():
    #return render_template("index.html", base_url=base_url)
    return render_template("gallery_creator.html", base_url=base_url)


@app.route("/tributary/")
def tributary():
    return render_template("tributary.html", base_url=base_url)

@app.route("/reptile/")
def reptile():
    return render_template("reptile.html", base_url=base_url)


@app.route("/delta/")
def delta():
    return render_template("delta.html", base_url=base_url)

@app.route("/flow/")
def flow():
    return render_template("flow.html", base_url=base_url)

@app.route("/geyser/")
def geyser():
    return render_template("geyser.html", base_url=base_url)

@app.route("/fountain/")
def fountain():
    return render_template("fountain.html", base_url=base_url)



@app.route("/tributary/api/<gist>/<filename>")
def internal_gist(gist, filename):
    code = ""

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

@app.route("/tributary/<gist>/<filename>")
def tributary_gist(gist=None, filename=None):
    #print gist, filename
    #return render_template("water.html", code=code, base_url=base_url) 
    return render_template("tributary.html", gist=gist, filename=filename, base_url=base_url) 

@app.route("/reptile/<gist>/<filename>")
def reptile_gist(gist=None, filename=None):
    #print gist, filename
    #return render_template("water.html", code=code, base_url=base_url) 
    return render_template("reptile.html", gist=gist, filename=filename, base_url=base_url) 


@app.route("/delta/<gist>/<filename>")
def delta_gist(gist=None, filename=None):
    #print gist, filename
    #return render_template("water.html", code=code, base_url=base_url) 
    return render_template("delta.html", gist=gist, filename=filename, base_url=base_url) 

@app.route("/flow/<gist>/<filename>")
def flow_gist(gist=None, filename=None):
    #print gist, filename
    #return render_template("water.html", code=code, base_url=base_url) 
    return render_template("flow.html", gist=gist, filename=filename, base_url=base_url) 

@app.route("/geyser/<gist>/<filename>")
def geyser_gist(gist=None, filename=None):
    #print gist, filename
    #return render_template("water.html", code=code, base_url=base_url) 
    return render_template("geyser.html", gist=gist, filename=filename, base_url=base_url) 

@app.route("/fountain/<gist>/<filename>")
def fountain_gist(gist=None, filename=None):
    #print gist, filename
    #return render_template("water.html", code=code, base_url=base_url) 
    return render_template("fountain.html", gist=gist, filename=filename, base_url=base_url) 



@app.route("/shore/<gist>/<filename>")
def shore_gist(gist=None, filename=None):
    #print gist, filename
    #return render_template("water.html", code=code, base_url=base_url) 
    return render_template("shore.html", gist=gist, filename=filename, base_url=base_url) 

@app.route("/carbonite/<gist>/<filename>")
def carbonite_gist(gist=None, filename=None):
    #print gist, filename
    #return render_template("water.html", code=code, base_url=base_url) 
    return render_template("carbonite.html", gist=gist, filename=filename, base_url=base_url) 


@app.route("/embed/<gist>/<filename>")
def embed_gist(gist=None, filename=None):
    #print gist, filename
    #return render_template("water.html", code=code, base_url=base_url) 
    return render_template("embed.html", gist=gist, filename=filename, base_url=base_url) 




import urllib
@app.route("/tributary/save", methods=["POST"])
@app.route("/delta/save", methods=["POST"])
@app.route("/flow/save", methods=["POST"])
def save():
    #gistobj = json.loads(request.values.get("gist"))
    data = request.values.get("gist")
    #data = urllib.urlencode(gistobj)
    #print "gistobj", data

    url = 'https://api.github.com/gists'
    req = urllib2.Request(url, data)
    ret = urllib2.urlopen(req).read()
    #print "ret", ret
    resp = make_response(ret, 200)
    #TODO: get this working behind apache
    #resp.headers['Conent-Type'] = 'application/json'

    return resp


if __name__ == "__main__":
    app.run(host="localhost", port=8888)
