const http = require('http');
const path = require('path');
const lb = require('../serverLb/library/nodelb');
// const lb = require('nodelb');
const errorLog = require('./../serverLb/library/errorLog');
const statsController = require('../controllers/statsController');


const options = [];
for (let i = 2; i < process.argv.length; i += 2) {
  options.push({
    hostname: process.argv[i],
    port: process.argv[i + 1],
    active: true,
  });
}

const rp = lb.deploy('rp', options, () => statsController.createSession(options));
errorLog.Init(path.join(__dirname + '/healthCheck.log'));
rp.setRoutes([['GET', '/']]); // ['GET', '/html']
rp.healthCheck(10000);
rp.on('cacheRes', () => statsController.countRequests('Cached Response'));
rp.on('targetRes', () => statsController.countRequests(options[0].hostname.concat(':').concat(options[0].port)));

const server = http.createServer((bReq, bRes) => {
  if (bReq.method === 'GET' && bReq.url === '/stats') return statsController.getServerStats(bReq, bRes);
  rp.init(bReq, bRes);
}).listen(1337);
console.log('Server running at 127.0.0.1:1337');
