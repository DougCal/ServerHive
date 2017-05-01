const http = require('http');
const lb = require('./library/nodelicious');
const statsController = require('../controllers/statsController');


const options = [];
for (let i = 2; i < process.argv.length; i += 2) {
  options.push({
    hostname: process.argv[i],
    port: process.argv[i + 1],
    active: true,
  });
}

const rp = lb.deploy('rp', options, () => {
  console.log('INIT!!!!!!!!!!');
  statsController.createSession(options);
});

rp.setRoutes([['GET', '/html'], ['GET', '/']]);
rp.healthCheck(10000);
rp.on('cacheRes', () => {
  console.log('COUNTING!!!!!!!!!!');
  statsController.countRequests('lb');
});
rp.on('targetRes', () => {
  console.log('COUNTING!!!!!!!!!!');
  statsController.countRequests(options[0].hostname.concat(':').concat(options[0].port));
});



const server = http.createServer((bReq, bRes) => {
  // console.log(options[0].port, ' ', options[0].active);
  // console.log(options[1].port, ' ', options[1].active);
  // console.log(options[2].port, ' ', options[2].active);
  // console.log('-----');
  if (bReq.method === 'GET' && bReq.url === '/stats') return statsController.getServerStats(bReq, bRes);
  rp.init(bReq, bRes);
}).listen(1337);
console.log('Server running at 127.0.0.1:1337');
