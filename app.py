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
    return render_template("index.html", base_url=base_url)
    #return render_template("gallery.html", base_url=base_url)

def render_defaults(template, gist=None, filename=None):
    #TODO: add user info
    if filename is None:
        filename=default_filename

    return render_template(template,
        gist=gist,
        filename=filename,
        base_url=base_url,
        loggedin=session.get("loggedin", False),
        userid=session.get("userid", ""),
        username=session.get("username", ""),
        avatar=session.get("avatar", ""),
        userurl=session.get("userurl", "")
        )

#Live editing d3 for exploring parameter spaces
@app.route("/tributary/")
@app.route("/tributary/<gist>/")
@app.route("/tributary/<gist>/<filename>")
def tributary_gist(gist=None, filename=None):
    return render_defaults("tributary.html", gist=gist, filename=filename)

#Live editing transitions
@app.route("/delta/")
@app.route("/delta/<gist>/")
@app.route("/delta/<gist>/<filename>")
def delta_gist(gist=None, filename=None):
    return render_defaults("delta.html", gist=gist, filename=filename)

#Live editing run loops
@app.route("/hourglass/")
@app.route("/hourglass/<gist>/")
@app.route("/hourglass/<gist>/<filename>")
def hourglass_gist(gist=None, filename=None):
    return render_defaults("hourglass.html", gist=gist, filename=filename)

#Live editing run loops for canvas
@app.route("/cypress/")
@app.route("/cypress/<gist>/")
@app.route("/cypress/<gist>/<filename>")
def cypress_gist(gist=None, filename=None):
    return render_defaults("cypress.html", gist=gist, filename=filename)

#Live editing run loops for canvas
@app.route("/levee/")
@app.route("/levee/<gist>/")
@app.route("/levee/<gist>/<filename>")
def levee_gist(gist=None, filename=None):
    return render_defaults("levee.html", gist=gist, filename=filename)



#Live editing boids (and other node based things)
@app.route("/bigfish/")
@app.route("/bigfish/<gist>/")
@app.route("/bigfish/<gist>/<filename>")
def bigfish_gist(gist=None, filename=None):
    return render_defaults("bigfish.html", gist=gist, filename=filename)

#Live editing boids (and other node based things) in canvas
@app.route("/fly/")
@app.route("/fly/<gist>/")
@app.route("/fly/<gist>/<filename>")
def fly_gist(gist=None, filename=None):
    return render_defaults("fly.html", gist=gist, filename=filename)




#Live editing music visualization
@app.route("/flow/")
@app.route("/flow/<gist>/")
@app.route("/flow/<gist>/<filename>")
def flow_gist(gist=None, filename=None):
    return render_defaults("flow.html", gist=gist, filename=filename)

#Experimenting with tiling and patterns
@app.route("/reptile/")
@app.route("/reptile/<gist>/")
@app.route("/reptile/<gist>/<filename>")
def reptile_gist(gist=None, filename=None):
    return render_defaults("reptile.html", gist=gist, filename=filename)


#Experimenting with three.js WebGL Library
@app.route("/curiosity/")
@app.route("/curiosity/<gist>/")
@app.route("/curiosity/<gist>/<filename>")
def curiosity_gist(gist=None, filename=None):
    return render_defaults("curiosity.html", gist=gist, filename=filename)


#Embedded view for Tributary
@app.route("/embed/<gist>/")
@app.route("/embed/<gist>/<filename>")
def embed_gist(gist=None, filename=None):
    return render_defaults("embed.html", gist=gist, filename=filename)

#Embedded view for Delta
@app.route("/shore/<gist>/")
@app.route("/shore/<gist>/<filename>")
def shore_gist(gist=None, filename=None):
    return render_defaults("shore.html", gist=gist, filename=filename)


@app.route("/tributary/api/<gist>/")
@app.route("/tributary/api/<gist>/<filename>")
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
        code = obj.read().decode('utf-8')
    except URLError, e:
        print "ERROR", e.code
    return code


@app.route('/github-login')
@app.route('/github-login/<product>', methods=["GET"])
@app.route("/github-login/<product>/<id>", methods=["GET"])
def github_login(product=None,id=None):
    if (product is None):
        # Default product
        product = "tributary"
    if(id is not None):
        #take user to github for authentication
        return redirect('https://github.com/login/oauth/authorize?client_id=' + GITHUB_CLIENT_ID + '&scope=gist' + '&state=/' + product + '/' + id)
    return redirect('https://github.com/login/oauth/authorize?client_id=' + GITHUB_CLIENT_ID + '&scope=gist' + '&state=/' + product)

@app.route('/github-logout')
@app.route("/github-logout/<product>", methods=["GET"])
@app.route("/github-logout/<product>/<id>", methods=["GET"])
def github_logout(product=None,id=None):
    session["access_token"] = None
    session["loggedin"] = None
    session["username"] = None
    session["avatar"] = None
    session["userid"] = None
    session["userurl"] = None
    if(product is None):
        product = "tributary"
    if (id is None):
        return redirect('/'+product)
    return redirect('/'+product+'/'+id)

@app.route("/github-authenticated")
def github_authenticated():
    #code poached from water: https://github.com/gabrielflorit/water/blob/master/water/views.py

    tempcode = request.args.get('code', '')
    # construct data and headers to send to github
    data = {'client_id': GITHUB_CLIENT_ID, 'client_secret': GITHUB_CLIENT_SECRET, 'code': tempcode }
    headers = {'content-type': 'application/json', 'accept': 'application/json'}

    # request an access token
    req = urllib2.Request('https://github.com/login/oauth/access_token', data=json.dumps(data), headers=headers)
    resp = json.loads(urllib2.urlopen(req).read())

    # save access token in session
    session['access_token'] = resp['access_token']
    # let client know we are logged in
    session['loggedin'] = True

    #get info about the user
    req = urllib2.Request("https://api.github.com/user?access_token=" + session['access_token'])
    resp = json.loads(urllib2.urlopen(req).read())
    session['username'] = resp['login']
    session['avatar'] = resp['avatar_url']
    session['userid'] = resp['id']
    session['userurl'] = resp['url']

    nexturl = request.args.get('state')

    #DONE: redirect back to next parameter
    return redirect(nexturl)


# DONE: make fork and save button different
# make js send gist id for fork or save unless its a fresh gist
# if fresh gist disable fork button

# Request a brand new Gist and return the Gist ID.
def fork__req_new(old_gist_id, data, token=None):
    url = 'https://api.github.com/gists'
    data = data.encode('utf-8')

    old_data = fetch_gist_content(old_gist_id, token)
    gist_history = ""
    if old_data:
        if old_data.get("files",{}).get("_.md",{}):
            gist_history = old_data.get("files",{}).get("_.md",{}).get("content",{})
    # print "Old_gist_id = ", old_gist_id
    new_data = json.loads(data)
    if old_gist_id is None:
        markdown = ""
    else:
        markdown = "<br/><a href=\"https://gist.github.com/" + old_gist_id + "\">Gist #" + old_gist_id  + "</a> "
    new_data["files"]["_.md"] = {"content": markdown + gist_history}
    data = json.dumps(new_data)
    data.encode('utf-8')

    headers = {'content-type': 'application/json; charset=utf-8', 'accept': 'application/json', 'encoding':'UTF-8'}
    if token is not None:
        headers['Authorization'] = 'token ' + token
        url = url.encode('utf-8')
        req = urllib2.Request(url, data, headers=headers)
    else:
        req = urllib2.Request(url, data, headers=headers)

    response = urllib2.urlopen(req)
    ret = response.read()

    gist = json.loads(ret)

    return gist

# Update an existing Gist
# TODO: post PNG snapshot of fork in Markdown now that we have new gist_id
def save__req_update(old_gist_id, new_gist_id, data, token=None):
    #print "ID", id
#    print "old_gist_id: ", old_gist_id
#    print "new_gist_id: ", new_gist_id

    url = 'https://api.github.com/gists/' + new_gist_id

    data = data.encode('utf-8')
#    print "DATA:",data
#    print "TOKEN: ",token

    old_data = fetch_gist_content(old_gist_id, token)
    gist_history = ""
    if old_data:
        if old_data.get("files",{}).get("_.md",{}):
            gist_history = old_data.get("files",{}).get("_.md",{}).get("content",{})

    new_data = json.loads(data)
    # TODO: allow product to change
    markdown = "[ <a href=\"http://enjalot.com/tributary/" + new_gist_id +"\">Launch Inlet</a> ]"
    if old_gist_id is not None:
        markdown = markdown + "<br/><a href=\"https://gist.github.com/" + old_gist_id + "\">Gist #" + old_gist_id  + "</a> "

    if gist_history is not None:
        markdown = markdown + gist_history
    else:
        markdown = markdown + "<br/><hr/>"

#    print "Updated MARKDOWN=",markdown

    new_data["files"]["_.md"] = {"content": markdown}
    data = json.dumps(new_data)
    data.encode('utf-8')

    headers = {'content-type': 'application/json; charset=utf-8', 'accept': 'application/json', 'encoding':'UTF-8'}
    url = url.encode('utf-8')
    #print "URL= ", url
    if token is not None:
        headers['Authorization'] = 'token ' + token
        req = urllib2.Request(url, data, headers=headers)
    else:
        req = urllib2.Request(url, data, headers=headers)

    # To to updating Gist (this applies a patch rather than creating a new Gist)
    req.get_method = lambda: 'PATCH'

    response = urllib2.urlopen(req)
    ret = response.read()

    gist = json.loads(ret)

    return gist



def save(old_gist_id, data, token=None):
    #if id, send a patch
    if(old_gist_id is not None):
        #TODO: check id is a valid id?
        print "USER saves existing gist"
        url = 'https://api.github.com/gists/' + old_gist_id
    else:
        #if not id create a new gist
        print "USER saves empty gist"
        url = 'https://api.github.com/gists'

    data = data.encode('utf-8')
    #print "DATA:",data
    #print "Old ID:",old_gist_id
    #print "TOKEN: ",token

    old_data = fetch_gist_content(old_gist_id, token)
    gist_history = ""
    if old_data:
        if old_data.get("files",{}).get("_.md",{}):
            gist_history = old_data.get("files",{}).get("_.md",{}).get("content",{})
    new_data = json.loads(data)
    markdown = ""
    if old_gist_id is not None:
        markdown = ""
    new_data["files"]["_.md"] = {"content": markdown + gist_history}
    data = json.dumps(new_data)
    data.encode('utf-8')

    #print "DATA", code
    #data = urllib.urlencode(code)

    headers = {'content-type': 'application/json; charset=utf-8', 'accept': 'application/json', 'encoding':'UTF-8'}
    url = url.encode('utf-8')
    if token is not None:
        headers['Authorization'] = 'token ' + token
        req = urllib2.Request(url, data, headers=headers)
    else:
        req = urllib2.Request(url, data, headers=headers)

    #to save over a gist
    if(old_gist_id is not None):
        req.get_method = lambda: 'PATCH'

    response = urllib2.urlopen(req)
    ret = response.read()

    new_gist_id = old_gist_id
    # Crated a new gist so we need to update the markdown
    if (old_gist_id is None):
        anon_gist_id = json.loads(ret)["id"]
        newgist = save__req_update(old_gist_id, anon_gist_id, data, token)
        ret = json.dumps(newgist)

    resp = make_response(ret, 200)
    resp.headers['Content-Type'] = 'application/json'

    return resp

#Save a tributary to a gist
@app.route("/tributary/save", methods=["POST"])
@app.route("/tributary/save/<id>", methods=["POST"])
def save_endpoint(id=None):
    #from urlparse import urlparse
    #parsed = urlparse('http://example.com')
    #print parsed.hostname
    #ufile = urllib2.urlopen(request.url)
    #baseurl = ufile.geturl()
    #print baseurl
    data = request.values.get("gist")
    token = session.get("access_token", None)
    return save(id, data, token)


#Save a tributary to a gist
@app.route("/tributary/fork", methods=["POST"])
@app.route("/tributary/fork/<prev_gist_id>", methods=["POST"])
def fork_endpoint(prev_gist_id=None):
    #TODO: check id is valid
#    print "ENTER ENDPOINT"
#    print "prev_gist_id= ",prev_gist_id

    # Data is the content to patch the gist with
    data = request.values.get("gist")
    data = data.encode('utf-8')

    token = session.get("access_token", None)
    userid = session.get("userid", None)

#    print 'userid=' , userid
#    print 'token=' , token
    #if (token is not None) or (prev_gist_id is not None):

#    print json.loads(data).get("user", {})
    gist_userid = json.loads(data).get("user", {}).get("id", None)

#    print 'gist_userid=' , gist_userid

    newgist = None

    if(prev_gist_id is None):
        # Starting from zero history
        print "NO GIST"
        # Fork with None for history
        newgist = fork__req_new(None, data, token)
    elif(userid is None):
        # if user doesn't own this gist, just fork it
        print "ANON forks SELF/USER"
        newgist = fork__req_new(prev_gist_id, data, token)
    else:
        # User owns gist, create a new fork
        print "USER forks SELF/ANON"
        # Fork the Gist (with our Username to get a new ID) and update it with the history of
        # forks
        anon_gist_id = fork__req_new(prev_gist_id, data, token)["id"]
        newgist = save__req_update(prev_gist_id, anon_gist_id, data, token)
#    print "NEW GIST: ", newgist
    resp = make_response(json.dumps(newgist), 200)
    resp.headers['Content-Type'] = 'application/json'
    return resp

def fetch_gist_content(id, token=None):
    if id is None:
        return None
    url = 'https://api.github.com/gists/' + id
    #need data to make this a post request
    #data = None
    data = "{}"
    headers = {
            'content-type': 'application/json; charset=utf-8',
            'accept': 'application/json',
            'encoding':'UTF-8'
    }
    if token is not None:
        #authenticate the request
        headers['Authorization'] = 'token ' + token
        #data = "{authenticity_token:" + token + "}"
        #data = "{access_token:" + token + "}"
        #print "LOGGED IN, using TOKEN", token
        #url += "?access_token="+token
        #url = url.encode('utf-8')
        req = urllib2.Request(url, headers=headers)
        #req = urllib2.Request(url, data)
    else:
        print "NOT LOGGED IN"
        req = urllib2.Request(url, headers=headers)

    response = urllib2.urlopen(req)

    ret = response.read()
    gist = json.loads(ret)
    return gist

def fork(id, token=None):
    #print "FORKING", id

    url = 'https://api.github.com/gists/' + id + '/fork'
    #need data to make this a post request
    #data = None
    data = "{}"
    headers = {
            'content-type': 'application/json; charset=utf-8',
            'accept': 'application/json',
            'encoding':'UTF-8'
    }
    if token is not None:
        #authenticate the request
        headers['Authorization'] = 'token ' + token
        #data = "{authenticity_token:" + token + "}"
        #data = "{access_token:" + token + "}"
        #print "LOGGED IN, using TOKEN", token
        #url += "?access_token="+token
        #url = url.encode('utf-8')
        req = urllib2.Request(url, data, headers=headers)
        #req = urllib2.Request(url, data)
    else:
        #print "NOT LOGGED IN"
        req = urllib2.Request(url, data, headers=headers)

    response = urllib2.urlopen(req)

    ret = response.read()
    gist = json.loads(ret)
    #print "ret", gist["id"]
    return gist



@app.route("/latest/<user>/")
def latest_user(user):
    return render_template("latest.html", username=user)




"""
#An experimental view that allowed creating screenshots from the gallery
@app.route("/creator")
def creator():
    return render_defaults("gallery_creator.html", base_url=base_url)
"""

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
