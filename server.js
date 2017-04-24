const http = require('http');
const path = require('path');
const fs = require('fs');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({});

const workerServers = [
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4000',
];

const server = http.createServer((req, res) => {
  let body = '';
  // console.log(req.url);
  // req.on('end', (request) => {
  //   console.log(request);
  //   workerServers.push(workerServers.shift());
  //   console.log(workerServers[0]);
  // });
  if (req.url !== null && req.url !== '/favicon.ico') {
    workerServers.push(workerServers.shift());
    // console logging request data
    req.on('data', (data) => {
      body += data;
      console.log('1337 data buffering');
    }).on('end', () => {
      let ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
      console.log('1337 Requesting Data: ', req.url);
      console.log('1337 Requesting IP: ', ip, ' port: ', req.connection.remotePort);
    });

    proxy.on('proxyReq', (proxyReq, request, response, options) => {
      response.setHeader('App-Proxy', 'proxy');
      console.log('proxyReq sent: ' + proxyReq.method);
    });

    proxy.on('proxyRes', (proxyRes, request, response) => {
      let dataBody = '';
      proxyRes.on('data', (chunk) => {
        dataBody += chunk;
      }).on('end', () => {
        console.log('proxyRes data received: ' + dataBody);
        console.log('proxyRes headers received: ' + JSON.stringify(proxyRes.headers));
      });
    });
    //   console.log({
    //     body: body,
    //     header: req.headers,
    //     url: req.url,
    //     method: req.method,
    //   });
    // });

    res.on('finish', () => {
      console.log('Response sent to client.');
    });
    proxy.web(req, res, { target: workerServers[0] });

    // proxy.on('proxyRes', (proxyRes, request, response) => {
    //   console.log();
    //   workerServers.push(workerServers.shift());
    // });
  }
}).listen(1337, '127.0.0.1');
console.log('Server running at 127.0.0.1:1337');


// server.on('connection', (req, socket) => {
//   console.log(req.url);
//   workerServers.push(workerServers.shift());
//   console.log(workerServers[0]);
// });
