const http = require('http');
const path = require('path');
const fs = require('fs');
const httpProxy = require('http-proxy');

http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      res.end(data);
    });
  }
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('LOOK AT ME\n Server 4000');
  }
}).listen(4000, '127.0.0.1');
console.log('Server running at 127.0.0.1:6379');
