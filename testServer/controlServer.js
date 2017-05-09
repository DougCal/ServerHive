const http = require('http');
const lb = require('../serverLb/library/nodelb');
// const lb = require('nodelb');
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
rp.setRoutes([['GET', '/html']]); //  ['GET', '/']
rp.healthCheck(10000);
rp.on('cacheRes', () => statsController.countRequests('Cached Response'));
rp.on('targetRes', () => statsController.countRequests(options[0].hostname.concat(':').concat(options[0].port)));

const server = http.createServer((bReq, bRes) => {
  if (bReq.method === 'GET' && bReq.url === '/stats') return statsController.getServerStats(bReq, bRes);
  rp.init(bReq, bRes);
}).listen(1337);
console.log('Server running at 127.0.0.1:1337');

wsProxy.init(server, options);
