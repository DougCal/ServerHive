const http = require('http');
const path = require('path');
const fs = require('fs');
const authController = require('./authController');

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
    authController.login(req, res);
  }

  if (req.method === 'GET' && req.url === '/verifyUser') {
    authController.verifyUser(req, (isVerified) => {
      res.end(JSON.stringify(isVerified));
    });
  }
}).listen(port); // ex ec2-52-53-200-5.us-west-1.compute.amazonaws.com
console.log('Server running at port ' + port);

