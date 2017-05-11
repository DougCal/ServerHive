const https = require('https');
const http = require('http');
const EventEmitter = require('events');
const fs = require('fs');
const errorLog = require('./errorLog');
const throttleIP = require('./throttleIP');

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
    if (routes === null || routes === undefined) {
      throw 'Set Routes received input that was either null or undefined';
      //throw 'Error: setRoutes received input that was either NULL or undefined'
    }
    if (!Array.isArray(routes)) {
      throw 'Error: setRoutes expects an input of type "Array", per documentation it expects a nested Array';
    }
    for (let i = 0; i < routes.length; i++) {
      let temp = routes[i][0].concat(routes[i][1]);
      this.routes[temp] = true;
    }
  };

  addOptions(options) {
    if (!Array.isArray(options)) {
      throw 'Error: addOptions expects an input of type "Array"';
    }
    if (options === null || options === undefined) {
      throw 'Error: Options is a required parameter for addOptions';
    }
    for (let i = 1; i < options.length; i += 1) {
      this.options.push(options[i]);
    }
  };

  healthCheck(interval = null, ssl = false) {
    /*
  15 minute interval healthcheck sends dummy get request to servers(ports) to check server health
  alters 'active' boolean value based on result of health check
    */
    // loops through servers in options & sends mock get request to each
    const options = this.options;

    let protocol;
    ssl ? protocol = https : protocol = http;

    for (let i = 0; i < options.length; i += 1) {
      protocol.get(options[i], (res) => {
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
        this.healthCheck(interval, ssl);
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

  determineProtocol(options, body, target, cache, routes, bReq, bRes, ssl) {
    let protocol;
    ssl ? protocol = https : protocol = http;
    return protocol.request(options, (sRes) => {
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

  init(bReq, bRes, ssl = false, delay = 0, requests = 0) {
    // if (delay > 0 || requests > 0) throttleIP(bReq, bRes, delay, requests);

  init(bReq, bRes, secureHTTP = null) {
    if (!bReq) throw 'Error: The browser request was not provided to init';
    if (!bRes) throw 'Error: The browser response was not provided to init';

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

        const serverOptions = {};
        serverOptions.method = bReq.method;
        serverOptions.path = bReq.url;
        serverOptions.headers = bReq.headers;
        serverOptions.hostname = target.hostname;
        serverOptions.port = target.port;

        target.openRequests += 1;
        // console.log(options);
        let originServer = this.determineProtocol(serverOptions, body, target, cache, routes, bReq, bRes, ssl);

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
    if (options === null || options === undefined) {
      throw 'Error: Options is a required parameter for this method';
    }
    this.options = options;
    cb();
    return this;
  }
}

const loadBalancer = new LoadBalancer();

module.exports = loadBalancer.lbInit;
