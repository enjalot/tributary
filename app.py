from flask import Flask, render_template, request, make_response
import urllib2
from urllib2 import URLError, HTTPError
import json

app = Flask(__name__)
app.debug = True

base_url = "/static/water/"

@app.route("/")
def hello():
    return render_template("index.html", base_url=base_url)

@app.route("/tributary/")
def tributary():
    return render_template("water.html", base_url=base_url)

@app.route("/delta/")
def delta():
    return render_template("delta.html", base_url=base_url)

@app.route("/silt/")
def silt():
    return render_template("silt.html", base_url=base_url)





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
    return render_template("water.html", gist=gist, filename=filename, base_url=base_url) 

@app.route("/delta/<gist>/<filename>")
def delta_gist(gist=None, filename=None):
    #print gist, filename
    #return render_template("water.html", code=code, base_url=base_url) 
    return render_template("delta.html", gist=gist, filename=filename, base_url=base_url) 




import urllib
@app.route("/tributary/save", methods=["POST"])
@app.route("/delta/save", methods=["POST"])
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
