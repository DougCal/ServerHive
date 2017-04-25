const http = require('http');
const path = require('path');
const fs = require('fs');

const port = process.argv[2];

const server = http.createServer((req, res) => {
  console.log(req.url);
  if (req.method === 'GET' && req.url === '/html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      res.end(data);
    });
  }
  if (req.method === 'GET' && req.url === '/favicon.ico') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('done');
  }
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('LOOK AT ME\n Server ' + port, () => console.log('response completed 3000'));
  }
  if (req.method === 'GET' && req.url === '/bundle.js') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    fs.readFile(path.join(__dirname, 'testPayload/bundle.js'), (err, data) => {
      res.end(data);
    });
  }
}).listen(port); // ex ec2-52-53-200-5.us-west-1.compute.amazonaws.com
console.log('Server running at port' + port);

