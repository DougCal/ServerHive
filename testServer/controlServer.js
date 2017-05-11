const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');
const lb = require('../serverLb/library/nodelb');
// const lb = require('nodelb');
const errorLog = require('./../serverLb/library/errorLog');
const statsController = require('../controllers/statsController');
const wsProxy = require('../serverLb/library/wsproxy.js');

const options = [];
for (let i = 2; i < process.argv.length; i += 2) {
  options.push({
    hostname: process.argv[i],
    port: process.argv[i + 1],
    openSockets: 0,
    openRequests: 0,
    active: true,
  });
}

const rp = lb.deploy('rp', options, () => statsController.createSession(options));
errorLog.Init(path.join(__dirname + '/healthCheck.log'));
rp.setRoutes([['GET', '/']]); // ['GET', '/html']
// method for checking https
// method for checking http

rp.on('cacheRes', () => statsController.countRequests('Cached Response'));
rp.on('targetRes', () => statsController.countRequests(options[0].hostname.concat(':').concat(options[0].port)));


// rp.healthCheck(10000);
// const server = http.createServer((bReq, bRes) => {
//   console.log(process.memoryUsage().heapUsed); //----------- memory test
//   if (bReq.method === 'GET' && bReq.url === '/stats') return statsController.getServerStats(bReq, bRes);
//   rp.init(bReq, bRes, false);
// }).listen(1337);
// console.log('Server running at 127.0.0.1:1337');

// uncomment secureOpts for when testing https

// ONLY uncomment below for testing https with a self-signed certificate
// uncomment to create a server with SSL and make sure secureOpts is uncommented

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const secureOpts = {
  key: fs.readFileSync('server-key.pem'),
  cert: fs.readFileSync('server-crt.pem'),
  ca: fs.readFileSync('ca-crt.pem'),
};
rp.healthCheck(10000, true);
const server = https.createServer(secureOpts, (bReq, bRes) => {
  console.log(bReq.url);
  console.log(options[0].active, options[1].active, options[2].active);
  if (bReq.method === 'GET' && bReq.url === '/stats') return statsController.getServerStats(bReq, bRes);
  rp.init(bReq, bRes, true);
}).listen(1337);
console.log('Server blah running at 127.0.0.1:1337');

wsProxy.init(server, options, true);
