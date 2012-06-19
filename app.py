from flask import Flask, render_template, request, make_response, session, redirect
import urllib2
from urllib2 import URLError, HTTPError
import json

app = Flask(__name__)
app.debug = True

try:
    #If you want to be able to authenticate with github, you need to register an
    #application: https://github.com/settings/applications
    #And setup local_settings.py (you can copy from local_settings_example.py and fill in the keys)
    from local_settings import GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, FLASK_SECRET_KEY
except:
    pass

app.secret_key = FLASK_SECRET_KEY

base_url = "/"
#We assume a default filename of inlet.js to grab from the gist
default_filename = "inlet.js"

#Index page
@app.route("/")
def hello():
    #return render_template("index.html", base_url=base_url)
    return render_template("gallery.html", base_url=base_url)

def render_defaults(template, gist=None):
    #TODO: add user info

    return render_template(template, 
        gist=gist, 
        filename=default_filename, 
        base_url=base_url,
        loggedin=session.get("loggedin", False)
        ) 

#Live editing d3 for exploring parameter spaces
@app.route("/tributary/")
@app.route("/tributary/<gist>/")
def tributary_gist(gist=None):
    return render_defaults("tributary.html", gist=gist)

#Live editing transitions
@app.route("/delta/")
@app.route("/delta/<gist>/")
def delta_gist(gist=None):
    return render_defaults("delta.html", gist=gist)

#Live editing run loops
@app.route("/hourglass/")
@app.route("/hourglass/<gist>/")
def hourglass_gist(gist=None):
    return render_defaults("hourglass.html", gist=gist)

#Live editing music visualization
@app.route("/flow/")
@app.route("/flow/<gist>/")
def flow_gist(gist=None):
    return render_defaults("flow.html", gist=gist)

#Experimenting with tiling and patterns
@app.route("/reptile/")
@app.route("/reptile/<gist>/")
def reptile_gist(gist=None):
    return render_defaults("reptile.html", gist=gist)


#Embedded view for Tributary
@app.route("/embed/<gist>/")
def embed_gist(gist=None):
    return render_defaults("embed.html", gist=gist)

#Embedded view for Delta
@app.route("/shore/<gist>/")
def shore_gist(gist=None):
    return render_defaults("shore.html", gist=gist)


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


@app.route('/github-login')
def github_login():
    #take user to github for authentication
    return redirect('https://github.com/login/oauth/authorize?client_id=' + GITHUB_CLIENT_ID + '&scope=gist')

@app.route('/github-logout')
def github_logout():
    session["access_token"] = None
    session["loggedin"] = None
    print "SUP?"
    return redirect("/tributary")

@app.route("/github-authenticated")
def github_authenticated():
    #code poached from water: https://github.com/gabrielflorit/water/blob/master/water/views.py

    tempcode = request.args.get('code', '')
    # construct data and headers to send to github
    data = {'client_id': GITHUB_CLIENT_ID, 'client_secret': GITHUB_CLIENT_SECRET, 'code': tempcode }
    headers = {'content-type': 'application/json', 'accept': 'application/json'}

    # request an access token
    req = urllib2.Request('https://github.com/login/oauth/access_token', data=json.dumps(data), headers=headers)
    ret = urllib2.urlopen(req).read()

    # save access token in session
    try:
        session['access_token'] = json.loads(ret)['access_token']
    except:
        pass

    # let client know we are logged in
    session['loggedin'] = True

    #TODO: redirect back to next parameter
    return redirect('/tributary')

#Save a tributary to a gist
@app.route("/tributary/save", methods=["POST"])
def save():
    data = request.values.get("gist")
    url = 'https://api.github.com/gists'

    token = session.get("access_token", None)
    if token is not None:
        #print "LOGGED IN, using TOKEN", token
        headers = {'content-type': 'application/json', 'accept': 'application/json'}
        req = urllib2.Request(url + "?access_token="+token, data, headers=headers)
    else: 
        #print "NOT LOGGED IN"
        req = urllib2.Request(url, data)

    ret = urllib2.urlopen(req).read()
    #print "ret", ret
    resp = make_response(ret, 200)
    resp.headers['Content-Type'] = 'application/json'

    return resp


#An experimental view that allowed creating screenshots from the gallery
@app.route("/creator")
def creator():
    return render_defaults("gallery_creator.html", base_url=base_url)

#EXPIREMENTAL: these don't work with the rewrite, will need to be resurrected
"""
@app.route("/geyser/<gist>/<filename>")
def geyser_gist(gist=None, filename=None):
    return render_defaults("geyser.html", gist=gist, filename=default_filename, base_url=base_url) 

@app.route("/fountain/<gist>/<filename>")
def fountain_gist(gist=None, filename=None):
    return render_defaults("fountain.html", gist=gist, filename=default_filename, base_url=base_url) 

@app.route("/carbonite/<gist>/<filename>")
def carbonite_gist(gist=None, filename=None):
    return render_defaults("carbonite.html", gist=gist, filename=default_filename, base_url=base_url) 
"""

if __name__ == "__main__":
    app.run(host="localhost", port=8888)
