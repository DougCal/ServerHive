const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');
const lb = require('nodelb');
const statsController = require('../controllers/statsController');
// const lb = require('../serverLb/library/nodelb');
// const errorLog = require('./../serverLb/library/errorLog');

const options = [
  {
    hostname: '127.0.0.1',
    port: 3000,
  },
  {
    hostname: '127.0.0.1',
    port: 4000,
  },
  {
    hostname: '127.0.0.1',
    port: 5000,
  },
];

const rp = lb.deploy('rp', options, () => statsController.createSession(options));
const wspool = lb.deploy('wspool');
const errorLog = lb.deploy('errorLog');
errorLog.init(path.join(__dirname, '/healthCheck.log'));
rp.setRoutes([['GET', '/']]);
rp.on('cacheRes', () => statsController.countRequests('Cached Response'));
rp.on('targetRes', () => statsController.countRequests(options[0].hostname.concat(':').concat(options[0].port)));
rp.healthCheck(10000);

const server = http.createServer((bReq, bRes) => {
  if (bReq.method === 'GET' && bReq.url === '/stats') return statsController.getServerStats(bReq, bRes);
  rp.init(bReq, bRes, false);  // <---- reverse proxy begins
}).listen(1337);
console.log('Server running at 127.0.0.1:1337');

wspool.init(server, options, false);

rp.setRoutes([['GET', '/']]); // ['GET', '/html']
rp.clearCache(3000);
// method for checking https
// method for checking http

// uncomment secureOpts for when testing https

// ONLY uncomment below for testing https with a self-signed certificate
// uncomment to create a server with SSL and make sure secureOpts is uncommented
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// const secureOpts = {
//   key: fs.readFileSync('server-key.pem'),
//   cert: fs.readFileSync('server-crt.pem'),
//   ca: fs.readFileSync('ca-crt.pem'),
// };
// rp.healthCheck(10000, true);
// const server = https.createServer(secureOpts, (bReq, bRes) => {
//   // console.log(options[0].active, options[1].active, options[2].active);
//   if (bReq.method === 'GET' && bReq.url === '/stats') return statsController.getServerStats(bReq, bRes);
//   rp.init(bReq, bRes, true) // , 5000, 10);
// }).listen(1337);
// console.log('Server blah running at 127.0.0.1:1337');

// wspool.init(server, options, true);

//console.log(process.memoryUsage().heapUsed); //----------- memory test

