const https = require('https');
const http = require('http');
const EventEmitter = require('events');
const fs = require('fs');
const errorLog = require('./errorLog');

class LoadBalancer extends EventEmitter {
  constructor() {
    super();
    this.algo = 'lc';
    this.cache = {};
    this.options = [];
    this.routes = {};
    this.addOptions = this.addOptions.bind(this);
    this.setRoutes = this.setRoutes.bind(this);
    this.healthCheck = this.healthCheck.bind(this);
    this.clearCache = this.clearCache.bind(this);
    this.isStatic = this.isStatic.bind(this);
    this.shouldCache = this.shouldCache.bind(this);
    this.cacheContent = this.cacheContent.bind(this);
    this.init = this.init.bind(this);
    this.lbInit = this.lbInit.bind(this);
  };

  setAlgoRR() {
    this.algo = 'rr';
  }

  setAlgoLC() {
    this.algo = 'lc';
  }

  setRoutes(routes) {
    for (let i = 0; i < routes.length; i++) {
      let temp = routes[i][0].concat(routes[i][1]);
      this.routes[temp] = true;
    }
  };

  addOptions(options) {
    for (let i = 1; i < options.length; i += 1) {
      this.options.push(options[i]);
    }
  };

  healthCheck(interval = null) {
    /*
  15 minute interval healthcheck sends dummy get request to servers(ports) to check server health
  alters 'active' boolean value based on result of health check
    */
    // loops through servers in options & sends mock get request to each
    const options = this.options;

    for (let i = 0; i < options.length; i += 1) {
      http.get(options[i], (res) => {
        if (res.statusCode > 100 && res.statusCode < 400) {
          if (options[i].active === false) options[i].active = true;
        } else {
          options[i].active = false;
        }
        res.on('end', () => {
          // response from server received, reset value to true if prev false
          if (options[i].active === false) options[i].active = true;
        });
      }).on('error', (e) => {
        e.name = "HealthCheck Error";
        errorLog.write(e);
        // if error occurs, set boolean of 'active' to false to ensure no further requests to server
        if (e) {
          options[i].active = false;
        }
      });
    }
    if (interval !== null) {
      setTimeout(() => {
        this.healthCheck(interval);
      }, interval);
    }
  }

  healthCheckForHTTPS(interval = null) {
    /*
  15 minute interval healthcheck sends dummy get request to servers(ports) to check server health
  alters 'active' boolean value based on result of health check
    */
    // loops through servers in options & sends mock get request to each
    const options = this.options;

    for (let i = 0; i < options.length; i += 1) {
      https.get(options[i], (res) => {
        if (res.statusCode > 100 && res.statusCode < 400) {
          if (options[i].active === false) options[i].active = true;
        } else {
          options[i].active = false;
        }
        res.on('end', () => {
          // response from server received, reset value to true if prev false
          if (options[i].active === false) options[i].active = true;
        });
      }).on('error', (e) => {
        e.name = "HealthCheck Error";
        errorLog.write(e);
        // if error occurs, set boolean of 'active' to false to ensure no further requests to server
        if (e) {
          options[i].active = false;
        }
      });
    }
    if (interval !== null) {
      setTimeout(() => {
        this.healthCheckForHTTPS(interval);
      }, interval);
    }
  }

  clearCache(interval = null) {
    this.cache = {};
    if (interval !== null) {
      setTimeout(() => {
        this.clearCache(this.cache, interval);
      }, interval);
    }
  }

  isStatic(bReq) {
    // if file is html/css/javascript
    return bReq.url.slice(bReq.url.length - 5) === '.html' || bReq.url.slice(bReq.url.length - 4) === '.css' || bReq.url.slice(bReq.url.length - 3) === '.js';
    // flag variable set to true to enable caching before sending response to browser
  };


  shouldCache(bReq, routes) {
    // user input 'all' to allow cacheEverything method to always work
    // if (bReq === 'all') return true;
    // console.log(routes);
    return this.isStatic(bReq) || routes[bReq.method + bReq.url];
  };

  cacheContent(body, cache, bReq, routes) {
    // console.log(loadBalancer.shouldCache(bReq, routes));
    if (this.shouldCache(bReq, routes)) {
      // cache response
      cache[bReq.method + bReq.url] = body;
    }
  }

  insecureHTTP(options, body, target, cache, routes, bReq, bRes) {
    return http.request(options, (sRes) => {
      // console.log('connected');
      bRes.writeHead(200, sRes.headers);
      if (!this.shouldCache(bReq, routes)) {
        sRes.pipe(bRes);
        target.openRequests -= 1;
      } else {
        sRes.on('data', (data) => {
          body += data;
        });
        sRes.on('end', (err) => {
          // console.log(process.memoryUsage().heapUsed); //----------- memory test
          if (err) errorLog.write(err);
          target.openRequests -= 1;
          this.cacheContent(body, cache, bReq, routes);
          bRes.end(body);
        });
      }
    });
  }

  secureHTTP(options, body, target, cache, routes, bReq, bRes) {
    return https.request(options, (sRes) => {
      bRes.writeHead(200, sRes.headers);
      if (!this.shouldCache(bReq, routes)) {
        sRes.pipe(bRes);
        target.openRequests -= 1;
      } else {
        sRes.on('data', (data) => {
          body += data;
        });
        sRes.on('end', (err) => {
          // console.log(process.memoryUsage().heapUsed); //----------- memory test
          if (err) errorLog.write(err);
          target.openRequests -= 1;
          this.cacheContent(body, cache, bReq, routes);
          bRes.end(body);
        });
      }
    });
  };

  init(bReq, bRes, https = false) {
    const options = this.options;
    const cache = this.cache;
    const routes = this.routes;

    if (cache[bReq.method + bReq.url]) {
      // STATS GATHERING
      // statsController.countRequests('lb');
      this.emit('cacheRes');

      bRes.end(cache[bReq.method + bReq.url]);
    } else {
      // STATS GATHERING
      // statsController.countRequests(options[0].hostname.concat(':').concat(options[0].port));
      this.emit('targetRes');
      let body = '';
      // check for valid request & edge case removes request to '/favicon.ico'
      if (bReq.url !== null && bReq.url !== '/favicon.ico') {
        // console.log('before options used: ', options);
        let INDEXTEST = 0;
        let target = null;
        options.push(options.shift());
        if (this.algo === 'rr') {
          while (!options[0].active) options.push(options.shift());
          target = options[0];
        } else if (this.algo === 'lc') {
          while (!options[0].active) options.push(options.shift());
          const min = {};
          min.reqs = options[0].openRequests;
          min.option = 0;
          for (let i = 1; i < options.length; i += 1) {
            // console.log(options[i].openRequests);
            if (options[i].openRequests < min.reqs && options[i].active) {
              min.reqs = options[i].openRequests;
              min.option = i;
              INDEXTEST = i;
              // console.log(min);
            }
          }
          target = options[min.option];
        }
        // this is where https will have to happen
        // Call origin server!!!!!!

        // const secureOpts = {
        //   hostname: target.hostname,
        //   port: target.port,
        //   path: bReq.url,
        //   headers: bReq.headers,
        //   method: bReq.method,
        //   key: fs.readFileSync('server-key.pem'),
        //   cert: fs.readFileSync('server-crt.pem'),
        //   ca: fs.readFileSync('ca-crt.pem'),
        // };
        const serverOptions = {};
        serverOptions.method = bReq.method;
        serverOptions.path = bReq.url;
        serverOptions.headers = bReq.headers;
        serverOptions.hostname = target.hostname;
        serverOptions.port = target.port;

        target.openRequests += 1;
        // console.log(options);
        let originServer;
        if (https) {
          // const secureKeys = Object.keys(secureHTTP);
          // for (let i = 0; i < secureKeys.length; i += 1) serverOptions[secureKeys[i]] = secureHTTP[secureKeys[i]];
          originServer = this.secureHTTP(serverOptions, body, target, cache, routes, bReq, bRes);
        } else {
          originServer = this.insecureHTTP(serverOptions, body, target, cache, routes, bReq, bRes);
        }
        originServer.on('error', e => {
          e.name = 'Target Server Error';
          errorLog.write(e);
        });
        bReq.pipe(originServer);
        // originServer.end();
      }
    }
  }

  lbInit(options, cb) {
    this.options = options;
    cb();
    return this;
  }
}

const loadBalancer = new LoadBalancer();

module.exports = loadBalancer.lbInit;
