const http = require('http');
const path = require('path');
const fs = require('fs');
const loadBalancer = require('./library/loadBalancer');

const options = [];
for (let i = 2; i < process.argv.length; i += 2) {
  options.push({
    hostname: process.argv[i],
    port: process.argv[i + 1],
    active: true,
  });
}

const lb = loadBalancer(options);
const routes = [['GET', '/html'], ['GET', '/']];
lb.setRoutes(routes);


const server = http.createServer((bReq, bRes) => {
  // does everything for you
  // loadBalancer.lbHandler(bReq, bRes, options);
  lb.deploy(bReq, bRes);
}).listen(1337);
console.log('Server running at 127.0.0.1:1337');
