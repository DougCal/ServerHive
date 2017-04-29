const http = require('http');

const loadBalancer = {};
loadBalancer.cache = {};
loadBalancer.options = [];
loadBalancer.routes = {};

loadBalancer.setRoutes = (routes) => {

  for (let i = 0; i < routes.length; i++) {
    let temp = routes[i][0].concat(routes[i][1]);
    loadBalancer.routes[temp] = true;
  }
  console.log('final routes obj: ', loadBalancer.routes);
};

loadBalancer.addOptions = (options) => {
  // console.log(loadBalancer);
  loadBalancer.options = loadBalancer.options.concat(options);
  // console.log('addOptions paramter: ', options);
  // console.log('addOptions lb options: ', loadBalancer.options);
};

loadBalancer.healthCheck = (options = loadBalancer.options, interval = null) => {
  /*
15 minute interval healthcheck sends dummy get request to servers(ports) to check server health
alters 'active' boolean value based on result of health check
  */
  // loops through servers in options & sends mock get request to each
  for (let i = 0; i < options.length; i += 1) {
    http.get(options[i], (res) => {
      if (res.statusCode > 100 && res.statusCode < 400) {
        console.log('statusCode worked');
        if (options[i].active === false) options[i].active = true;
      } else {
        options[i].active = false;
        console.log('statusCode did not meet criteria, server active set to false');
      }
      res.on('data', (chunk) => {
        // console.log(chunk);
        // response from server received, reset value to true if prev false
        if (options[i].active === false) options[i].active = true;
      });
    }).on('error', (e) => {
      console.log('Got Error: '.concat(e.message));
      // if error occurs, set boolean of 'active' to false to ensure no further requests to server
      if (e) {
        options[i].active = false;
      }
    });
  }
  if (interval !== null) {
    setTimeout(() => {
      loadBalancer.healthCheck(options, interval);
    }, interval);
  }
};

loadBalancer.clearCache = (cache, interval = null) => {
  cache = {};
  if (interval === null) {
    setTimeout(() => {
      loadBalancer.clearCache(cache, interval);
    }, interval);
  }
};

loadBalancer.isStatic = (bReq) => {
  // if file is html/css/javascript
  return bReq.url.slice(bReq.url.length - 5) === '.html' || bReq.url.slice(bReq.url.length - 4) === '.css' || bReq.url.slice(bReq.url.length - 3) === '.js';
  // flag variable set to true to enable caching before sending response to browser
};

loadBalancer.shouldCache = (bReq, routes) => {
  // user input 'all' to allow cacheEverything method to always work
  // if (bReq === 'all') return true;
  // console.log(routes);
  return loadBalancer.isStatic(bReq) || routes[bReq.method + bReq.url] === true;
};

loadBalancer.cacheContent = (body, cache, bReq, routes) => {
  // console.log(loadBalancer.shouldCache(bReq, routes));
  if (loadBalancer.shouldCache(bReq, routes) === true) {
    console.log('Successfully cached request result');
    // cache response
    cache[bReq.method + bReq.url] = body;
  }
};

loadBalancer.deploy = (bReq, bRes, options = loadBalancer.options, cache = loadBalancer.cache, routes = loadBalancer.routes) => {
  if (cache[bReq.method + bReq.url]) {
    console.log('Request response exists, pulling from cache');
    bRes.end(cache[bReq.method + bReq.url]);
  } else {
    let body = '';
    // check for valid request & edge case removes request to '/favicon.ico'
    if (bReq.url !== null && bReq.url !== '/favicon.ico') {
      console.log('before options used: ', options);
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
          loadBalancer.cacheContent(body, cache, bReq, routes);
          // console.log(cache);

          if (sRes.headers['set-cookie']) {
            //console.log(sRes.headers['set-cookie'][0]);
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
};

loadBalancer.lbInit = (options) => {
  console.log('init: ', options);
  loadBalancer.addOptions(options);
  return loadBalancer;
};

module.exports = loadBalancer.lbInit;
