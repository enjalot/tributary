#Tributary
Tributary allows you to share live-editable code snippets. These snippets will
most likely use d3.js and allow a user to play with code in a very responsive
way.

Tributary is innovation on principle, taking the excellent work of Gabriel
Florit which was in turn inspired by Bret Victor's genius and making it sharable.

Tributary is a labor of love by Ian '@enjalot' Johnson and EJ '@mrejfox' Fox.

#Usage:
Start typing into the code editor and watch your code come to life!
If you want to save your work you can click the fork button and it will save into a gist.
The url in your browser will update to something like:
http://enjalot.com/tributary/2165875

where the number: 2165875 is the gist id 
(you can see it here: https://gist.github.com/2165875 ) 


#Development:
Tributary is an experimental environment and an experimental project. We are playing with
different "views" on code which have different assumptions. Once you get into it you may
find you want to make your own view. 

It's not too hard, just adding one endpoint to the backend, making a new template html and a new view javascript file.

If you want to have github authentication working you will need to setup a github app and fill out the local_settings.py (see local_settings_example.py)
The FLASK_SECRET_KEY is just a random string that's supposed to be unique to protect your sessions

On the backend tributary only depends on Flask:
```
sudo easy_install flask
```
To deploy locally run
```
git clone https://github.com/enjalot/tributary
cd ./tributary
python app.py
```

If you want to deploy behind apache, check out the sample apache config in server/sample_apache_config.txt


#Submodules:
A couple of external (client side) libraries are included as submodules, to use them:
```
git submodule init
git submodule update
```

The d3-plugins git repository is added mostly for the cie plugin for color spaces.

Some useful and commonly used data (like US state and World country boundaries) are provided by Zack Maril's repo
static/data
https://github.com/zmaril/Visualization-Data



TODO:

Remove all styling from code and use classes 
Convert the panel_gui to divs (don't use svg)

Make BV button work for any of the renders (not just svg)


Reserved properties of the tributary object:
tributary.initialize
tributary.init
tributary.run
tributary.g
tributary.ctx
tributary.t
tributary.loop
tributary.autoinit
tributary.pause
tributary.loop_type
tributary.bv
tributary.nclones
tributary.clone_opacity
tributary.duration
tributary.ease
tributary.reverse
tributary.render


