YAY

Tributary allows you to share live-editable code snippets. These snippets will
most likely use d3.js and allow a user to play with code in a very responsive
way.

Tributary is innovation on principle, taking the excellent work of Gabriel
Florit which was in turn inspired by Bret Victor's genius and making it sharable.

Tributary is a labor of love by Ian '@enjalot' Johnson and EJ '@mrejfox' Fox.

Usage:
If you want to make a script sharable you can simply paste it into a gist at
gist.github.com and compose a tributary link like so:

http://enjalot.com/tributary/2165875/sinwaves.js

where the number: 2165875 is the gist id 
(you can see it here: https://gist.github.com/2165875 ) 

and the filename given to the gist is sinwaves.js


Development:
This was put together with great haste in order to allow people to share. As
such we haven't taken much care to structure this well. 


Build instructions:
npm install -d coffee
cd static
coffee -c tributary.coffee

TODO: setup package.json and makefile



