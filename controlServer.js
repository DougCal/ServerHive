const http = require('http');
const path = require('path');
const fs = require('fs');

const workerServers = [
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4000',
];

let options = {};

const server = http.createServer((bReq, bRes) => {
  let body = '';
  options = {
    port: 3000,
    hostname: '127.0.0.1',
    method: bReq.method,
    path: bReq.url,
  };
  console.log(bReq.url);
  if (bReq.url !== null && bReq.url !== '/favicon.ico') {
    // workerServers.push(workerServers.shift());
    const originServer = http.request(options, (sRes) => {
      console.log('connected');
      sRes.pipe(bRes);
    });
    originServer.on('error', e => console.log(e));
    originServer.end();
  }
}).listen(1337, '127.0.0.1');
console.log('Server running at 127.0.0.1:1337');

// Things learned. . .
// 'pipe' is the same as the following:
// sRes.on('data', (data) => {
//   // body += data;
//   bRes.write(data);
// });
// sRes.on('end', () => {
//   bRes.end();
// });
