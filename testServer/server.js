const http = require('http');
const path = require('path');
const fs = require('fs');
const originServer = require('./../serverLb/library/originServer');

const options = {
  host: '127.0.0.1',
  port: 6379,
};

const rs = originServer(options);

const port = process.argv[2];
console.log(port);

const server = http.createServer((req, res) => {
  // console.log(req.headers.cookie);
  if (req.method === 'GET' && req.url === '/html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.readFile(path.join(__dirname, '..', 'index.html'), (err, data) => {
      res.end(data);
    });
  }

  if (req.method === 'GET' && req.url === '/') {
    console.log('server hit');
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('LOOK AT ME\n Server ' + port, () => console.log('response completed from port ' + port));
  }

  if (req.method === 'GET' && req.url === '/bundle.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    fs.readFile(path.join(__dirname, '..', 'testClient', 'bundle.js'), (err, data) => {
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
          console.log(reply);
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
}).listen(port); // ex ec2-52-53-200-5.us-west-1.compute.amazonaws.com
console.log('Server running at port ' + port);

