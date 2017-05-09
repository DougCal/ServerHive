const https = require('https');
const lb = require('../serverLb/library/nodelb');
const fs = require('fs');
// const lb = require('nodelb');
const statsController = require('../controllers/statsController');

const options = [];
for (let i = 2; i < process.argv.length; i += 2) {
  options.push({
    hostname: process.argv[i],
    port: process.argv[i + 1],
    active: true,
  });
}

const secureOpts = {
    key: fs.readFileSync('server-key.pem'),
    cert: fs.readFileSync('server-crt.pem'),
    ca: fs.readFileSync('ca-crt.pem'),
};
// ONLY uncomment below for testing https with a self-signed certificate
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const rp = lb.deploy('rp', options, () => statsController.createSession(options));
rp.setRoutes([['GET', '/']]); // ['GET', '/html']
rp.healthCheck(10000);
rp.on('cacheRes', () => statsController.countRequests('Cached Response'));
rp.on('targetRes', () => statsController.countRequests(options[0].hostname.concat(':').concat(options[0].port)));

const server = https.createServer(secureOpts, (bReq, bRes) => {
  if (bReq.method === 'GET' && bReq.url === '/stats') return statsController.getServerStats(bReq, bRes);
  rp.init(bReq, bRes);
}).listen(1337);
console.log('Server running at 127.0.0.1:1337');
