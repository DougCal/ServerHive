const http = require('http');
 // const loadBalancer = require('./library/loadBalancer');
const lb = require('./library/nodelicious');

const options = [];
for (let i = 2; i < process.argv.length; i += 2) {
  options.push({
    hostname: process.argv[i],
    port: process.argv[i + 1],
    active: true,
  });
}

 // const lb = loadBalancer(options);
const rp = lb.deploy('rp', options);
const routes = [['GET', '/html'], ['GET', '/']];
rp.setRoutes(routes);
rp.healthCheck(10000);

const server = http.createServer((bReq, bRes) => {
  // does everything for you
  // loadBalancer.lbHandler(bReq, bRes, options);
  rp.init(bReq, bRes);
}).listen(1337);
console.log('Server running at 127.0.0.1:1337');
