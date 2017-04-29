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
};

loadBalancer.addOptions = (options) => {
  loadBalancer.options = loadBalancer.options.concat(options);
};

loadBalancer.healthCheck = (interval = null) => {
  /*
15 minute interval healthcheck sends dummy get request to servers(ports) to check server health
alters 'active' boolean value based on result of health check
  */
  // loops through servers in options & sends mock get request to each
  const options = loadBalancer.options;
  console.log(options);
  for (let i = 0; i < options.length; i += 1) {
    http.get(options[i], (res) => {
      if (res.statusCode > 100 && res.statusCode < 400) {
        console.log('statusCode worked');
        if (options[i].active === false) options[i].active = true;
      } else {
        options[i].active = false;
        console.log('statusCode did not meet criteria, server active set to false');
      }
      res.on('end', () => {
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
      loadBalancer.healthCheck(interval);
    }, interval);
  }
};

loadBalancer.clearCache = (interval = null) => {
  loadBalancer.cache = {};
  if (interval !== null) {
    setTimeout(() => {
      loadBalancer.clearCache(cache, interval);
    }, interval);
  }
};

loadBalancer.isStatic = (bReq) => {
  // if file is html/css/javascript
  if (bReq.url.slice(bReq.url.length - 5) === '.html' || bReq.url.slice(bReq.url.length - 4) === '.css' || bReq.url.slice(bReq.url.length - 3) === '.js') {
    // flag variable set to true to enable caching before sending response to browser
    return true;
  }
  return false;
};

loadBalancer.shouldCache = (bReq, routes) => {
  // user input 'all' to allow cacheEverything method to always work
  // if (bReq === 'all') return true;
  // console.log(routes);
  if (loadBalancer.isStatic(bReq) || routes[bReq.method + bReq.url] === true) return true;
  return false;
};

loadBalancer.cacheContent = (body, cache, bReq, routes) => {
  // console.log(loadBalancer.shouldCache(bReq, routes));
  if (loadBalancer.shouldCache(bReq, routes) === true) {
    console.log('Successfully cached request result');
    // cache response
    cache[bReq.method + bReq.url] = body;
  }
};

loadBalancer.init = (bReq, bRes, options = loadBalancer.options, cache = loadBalancer.cache, routes = loadBalancer.routes) => {
  if (cache[bReq.method + bReq.url]) {
    console.log('Request response exists, pulling from cache');
    bRes.end(cache[bReq.method + bReq.url]);
  } else {
    let body = '';
    // check for valid request & edge case removes request to '/favicon.ico'
    if (bReq.url !== null && bReq.url !== '/favicon.ico') {
      // console.log('before options used: ', options);
      options.push(options.shift());
      if (!options[0].active) options.push(options.shift());
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
  // console.log('init: ', options);
  loadBalancer.addOptions(options);
  return loadBalancer;
};

module.exports = loadBalancer.lbInit;


