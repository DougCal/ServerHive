const http = require('http');
const path = require('path');
const fs = require('fs');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({});

const servers = [
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4000',
];

http.createServer((req, res) => {
  proxy.web(req, res, { target: servers[0] });
  proxy.on('proxyRes', (proxyRes, request, response) => {
    console.log(servers[0]);
    servers.push(servers.shift());
  });
}).listen(1337, '127.0.0.1');
console.log('Server running at 127.0.0.1:1337');
