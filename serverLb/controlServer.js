const http = require('http');
const path = require('path');
const fs = require('fs');

const options = [];
for (let i = 2; i < process.argv.length; i += 2) {
  options.push({
    hostname: process.argv[i],
    port: process.argv[i + 1],
    active: true,
  });
}

/*
10 second interval healthcheck sends dummy get request to servers(ports) to check server health
alters 'active' boolean value based on result of health check
*/
function healthCheck() {
  //loops through servers in options & sends mock get request to each
  for (let i = 0; i < options.length; i++) {
    http.get(options[i], (res) => {
      res.on('data', (chunk) => {
        //console.log(chunk);
        //response from server received, reset value to true if prev false
        if (options[i].active === false) options[i].active = true;
        //console.log(servers[i].active, servers[i]);
        //console.log(cache, 'cache');
        // console.log('typeof this cache = ', typeof cache[options[i]]);
      })
    }).on('error', (e) => {
      console.log('Got Error: ' + e.message);
      //if error occurs, set boolean of 'active' to false to ensure no further requests to server
      if (e) {
        options[i].active = false;
      }
    });
  }
}
// setInterval(healthCheck, 10000);

//server cache
const cache = {};

const server = http.createServer((bReq, bRes) => {
  //checks cache for request to specific URL
  //if found, sends out value of result from cache to browser through bRes.end()
  if (cache[bReq.method + bReq.url]) {
  // if (true === false) {
    // console.log('WE ARE USING A CACHE BECAUSE WE ARE EFFICIENT', cache);
    // console.log('HERE IS THE VALUE BITCH', cache[bReq.method + bReq.url]);
    bRes.end(cache[bReq.method + bReq.url]);
  }
  //request not already cached. Begin piping/processing response data
  else {
    let body = '';
    //check for valid request & edge case removes request to '/favicon.ico'
    if (bReq.url !== null && bReq.url !== '/favicon.ico') {
      options.push(options.shift());
      options[0].method = bReq.method;
      options[0].path = bReq.url;
      const originServer = http.request(options[0], (sRes) => {
        console.log('connected');
        let body = '';
        sRes.on('data', (data) => {
          body += data;
          // bRes.write(data);
        });
        sRes.on('end', () => {
          //adds new item to cache and stores data result of body
          cache[bReq.method + bReq.url] = body;
          // console.log('I AM THE CACHE LOOK AT ME', cache);
          // console.log('I AM THE BODY, AND I"M SEXY', body);
          bRes.end(body);
        });
      });
      originServer.on('error', e => console.log(e));
      originServer.end();
    }
  }
}).listen(1337);
console.log('Server running at 127.0.0.1:1337');
