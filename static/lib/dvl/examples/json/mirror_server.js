var path = require('path');
var http = require('http');
var paperboy = require('paperboy');

function log(statCode, url, ip, err) {
  var logStr = statCode + ' - ' + url + ' - ' + ip;
  if (err)
    logStr += ' - ' + err;
  console.log(logStr);
}

http.createServer(function (req, res) {
  if (req.url === '/favicon.ico') {
    res.end();
    return;
  }
  if (req.url.substr(0,2) === '/?') {
    var chunks = [];
    // never fires!
    req.setEncoding('utf8');
    req.on('data', function (chunk) { chunks.push(chunk); });
    req.on('end', function (a) {
      data = chunks.join('');
      console.log(req.url);
      if(req.method === 'GET') {
        var get = req.url.split('?')[1] || '';
      } else {
        var get = data
      }
      var getParts = get.split('&');
      var got = {};
      for (var i=0; i < getParts.length; i++) {
        var s = getParts[i].split('=', 2);
        got[s[0]] = s[1];
      }
      console.log(got);
      setTimeout(function() {
        try {
          var v = eval(got.expr);
          res.writeHead(200, {'Content-Type': 'text/plain'});
          res.end(JSON.stringify(v));
        } catch (e) {
          res.writeHead(501, {'Content-Type': 'text/plain'});
          res.end("POROBLEMO");
        }
      }, parseInt(got.sleep) || 1);
    });

  } else {
    var ip = req.connection.remoteAddress;
    paperboy
      .deliver(path.dirname(__filename), req, res)
      .addHeader('Expires', 300)
      .addHeader('X-PaperRoute', 'Node')
      .before(function() {
        console.log('Received Request');
      })
      .after(function(statCode) {
        log(statCode, req.url, ip);
      })
      .error(function(statCode, msg) {
        res.writeHead(statCode, {'Content-Type': 'text/plain'});
        res.end("Error " + statCode);
        log(statCode, req.url, ip, msg);
      })
      .otherwise(function(err) {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end("Error 404: File not found");
        log(404, req.url, ip, err);
      });
  }
  
}).listen(8900);
console.log('Server running at http://localhost:8900/');