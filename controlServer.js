const http = require('http');
const path = require('path');
const fs = require('fs');

const options = [];
console.log(process.argv);
for (let i = 2; i < process.argv.length; i += 2) {
  options.push({
    hostname: process.argv[i],
    port: process.argv[i + 1],
  });
}

const server = http.createServer((bReq, bRes) => {
  let body = '';
  console.log(bReq.url);
  if (bReq.url !== null && bReq.url !== '/favicon.ico') {
    options.push(options.shift());
    options[0].method = bReq.method;
    options[0].path = bReq.url;
    const originServer = http.request(options[0], (sRes) => {
      console.log('connected');
      sRes.pipe(bRes);
    });
    originServer.on('error', e => console.log(e));
    originServer.end();
  }
}).listen(1337);
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
