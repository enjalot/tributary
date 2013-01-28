var settings = module.exports;

settings.port = 8888;
settings.hostname = "localhost";
//on port 80 you don't want to specify the port, so settings.origin would be "http://tributary.io" for example
settings.origin = "http://" + settings.hostname + ":" + settings.port;
settings.sandboxOrigin = "http://sandbox." + settings.hostname + ":" + settings.port;

settings.SECRET = 'secret'

settings.GITHUB_CLIENT_ID=""
settings.GITHUB_CLIENT_SECRET=""

settings.IMGUR_CLIENT_ID="";
settings.IMGUR_CLIENT_SECRET="";
