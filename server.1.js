const http = require('http');
const path = require('path');
const fs = require('fs');
const httpProxy = require('http-proxy');

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
  let body = '';
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    // console logging response data
    res.end('LOOK AT ME\n Server 3000', () => console.log('response completed 3000'));
    // console.log(res.headers);
    // req.on('data', (data) => {
    //   body += data;
    //   console.log('3000 data buffering');
    // }).on('end', () => {
    //   let ip = req.headers['x-forwarded-for'];
    //   console.log('3000 Requesting Data: ', body);
    //   console.log('3000 Requesting IP: ', req.connection.remotePort);
    // });
  }
}).listen(3000, '127.0.0.1');
console.log('Server running at 127.0.0.1:3000');

// server.on('connection', (req, socket) => {
//   console.log('3000 connected');
// });
