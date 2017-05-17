const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');
const lb = require('../serverLb/library/nodelb');
const lb = require('nodelb');
const wsController = require('../controllers/wsController');

const options = {
  host: '127.0.0.1',
  port: 6379,
};

const rs = lb.deploy('redis', options);
const threads = lb.deploy('threads');
const port = process.argv[2];

const secureOpts = {
  key: fs.readFileSync('server-key.pem'),
  cert: fs.readFileSync('server-crt.pem'),
  ca: fs.readFileSync('ca-crt.pem'),
};

// for testing https, add secureOpts above as the first argument
// inside the createServer method, and change http to https
const server = https.createServer(secureOpts, (req, res) => {
  if (req.method === 'GET' && req.url === '/html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.readFile(path.join(__dirname, '..', 'index.html'), (err, data) => {
      res.end(data);
    });
  }

  if (req.method === 'GET' && req.url === '/') {
    // console.log('server hit');
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('LOOK AT ME\n Server ' + port, () => console.log('response completed from port ' + port));
  }

  if (req.method === 'GET' && req.url === '/bundle.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    fs.readFile(path.join(__dirname, '..', 'testClient', 'bundle.js'), (err, data) => {
      res.end(data);
    });
  }

  if (req.method === 'GET' && req.url === '/server.jpg') {
    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    fs.readFile(path.join(__dirname, '..', 'testClient', 'img', 'server.jpg'), (err, data) => {
      res.end(data);
    });
  }

  if (req.method === 'POST' && req.url === '/login') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    }).on('end', () => {
      body = JSON.parse(body);
      if (body.username === 'yo' && body.password === 'yo') {
        rs.authenticate(req, res, 'SID', body.username, (err, reply) => {
          // console.log(reply);
          res.end('true');
        });
      } else res.end('false');
    });
  }
  if (req.method === 'GET' && req.url === '/verifyUser') {
    rs.verifySession(req, 'SID', (isVerified) => {
      res.end(JSON.stringify(isVerified));
    });
  }
}).listen(port);
wsController(server, port);
// threads(server, port);
