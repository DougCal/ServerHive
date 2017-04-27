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
console.log(options);

/*
15 minute interval healthcheck sends dummy get request to servers(ports) to check server health
alters 'active' boolean value based on result of health check
*/
function healthCheck() {
  //loops through servers in options & sends mock get request to each
  for (let i = 0; i < options.length; i++) {
    http.get(options[i], (res) => {
      if (res.statusCode > 100 && res.statusCode > 400) {
        console.log('statusCode worked');
        if (options[i].active === false) options[i].active = true;
      }
      else {
        options[i].active = false;
        console.log('statusCode did not meet criteria, server active set to false');
      }
      res.on('data', (chunk) => {
        //console.log(chunk);
        //response from server received, reset value to true if prev false
        if (options[i].active === false) options[i].active = true;
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
//setInterval(healthCheck, 10000);
//setInterval(healthCheck, 900000);

function clearCache() {
  cache = {};
}
//resets cache on 24 hour interval
//setInterval(clearCache, 86400000);

//central server cache
const cache = {};

const routes = {
  // 'GET/html': null,
  'GET/': null,
}

const server = http.createServer((bReq, bRes) => {
  console.log(bReq.headers);
  //flag variable for caching
  let canCache = false;


  //checks if request is a HTML/JS/CSS file
  if (bReq.url.slice(bReq.url.length - 5) === '.html' || bReq.url.slice(bReq.url.length - 4) === '.css' || bReq.url.slice(bReq.url.length - 3) === '.js') {
    //flag variable set to true to enable caching before sending response to browser
    canCache = true;
    console.log('canCache is true, cache will occur before bRes.end');
  }

  //checks if route options exists in routes cache, default value is null
  if (routes[bReq.method + bReq.url] === null) {
    canCache = true;
    console.log('Route exists in routes cache, canCache = true now')
  }

  //checks if request result already exists in cache
  if (cache[bReq.method + bReq.url]) {
    console.log('Request response exists, pulling from cache');
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
      options[0].headers = bReq.headers;
      // Call origin server!!!!!!
      const originServer = http.request(options[0], (sRes) => {
        console.log('connected');
        sRes.on('data', (data) => {
          body += data;
          // bRes.write(data);
        });
        sRes.on('end', () => {

          //psuedocode 

          /*
          either need method to check if it has authentication or 
          to check for session/cookie info on response

          if requiresAuth() === true
          ---do not cache---
          else 
          cache[bReq.method + bReq.url] = body;
          */


          //checks flag variable from beginning of request to see if file type matches
          //kinds we want to cache
          if (canCache === true) {
            console.log('Successfully cached request result');
            //cache response
            cache[bReq.method + bReq.url] = body;
          }

          if (sRes.headers['set-cookie']) {
            console.log(sRes.headers['set-cookie'][0]);
            //bRes.writeHead(sRes.headers);
            bRes.writeHead(200, {
              'Set-Cookie': sRes.headers['set-cookie'][0],
            });
          }
          bRes.end(body);
        });
      });
      originServer.on('error', e => console.log(e));
      bReq.pipe(originServer);
      // originServer.end();
    }
  }
}).listen(1337);
console.log('Server running at 127.0.0.1:1337');
