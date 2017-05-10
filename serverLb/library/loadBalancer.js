const http = require('http');
const EventEmitter = require('events');
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
  }

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
  }

  healthCheck(interval = null) {
    /*
  15 minute interval healthcheck sends dummy get request to servers(ports) to check server health
  alters 'active' boolean value based on result of health check
    */
    // loops through servers in options & sends mock get request to each
    const options = this.options;
    //console.log(options);
    for (let i = 0; i < options.length; i += 1) {
      http.get(options[i], (res) => {
        if (res.statusCode > 100 && res.statusCode < 400) {
          // console.log('statusCode worked');
          if (options[i].active === false) options[i].active = true;
        } else {
          // errorLog.write(res.statusCode);
          options[i].active = false;
          // console.log('statusCode did not meet criteria, server active set to false');
        }
        res.on('end', () => {
          // response from server received, reset value to true if prev false
          if (options[i].active === false) options[i].active = true;
        });
      }).on('error', (e) => {
        e.name = "HealthCheck Error";
        errorLog.write(e);
        // console.log('Got Error: '.concat(e.message));
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
    if (bReq.url.slice(bReq.url.length - 5) === '.html' || bReq.url.slice(bReq.url.length - 4) === '.css' || bReq.url.slice(bReq.url.length - 3) === '.js') {
      // flag variable set to true to enable caching before sending response to browser
      return true;
    }
    return false;
  }

  shouldCache(bReq, routes) {
    // user input 'all' to allow cacheEverything method to always work
    // if (bReq === 'all') return true;
    // console.log(routes);
    if (this.isStatic(bReq) || routes[bReq.method + bReq.url] === true) return true;
    return false;
  }

  cacheContent(body, cache, bReq, routes) {
    // console.log(loadBalancer.shouldCache(bReq, routes));
    if (this.shouldCache(bReq, routes) === true) {
      // console.log('Successfully cached request result');
      // cache response
      cache[bReq.method + bReq.url] = body;
    }
  }

  init(bReq, bRes) {
    const options = this.options;
    const cache = this.cache;
    const routes = this.routes;
    if (cache[bReq.method + bReq.url]) {
      this.emit('cacheRes');
      // console.log('Request response exists, pulling from cache');
      bRes.end(cache[bReq.method + bReq.url]);
    } else {
      this.emit('targetRes');
      let body = '';
      // check for valid request & edge case removes request to '/favicon.ico'
      if (bReq.url !== null && bReq.url !== '/favicon.ico') {
        let INDEXTEST = 0;
        let target = null;
        options.push(options.shift());
        if (this.algo === 'rr') {
          while (!options[0].active) options.push(options.shift());
          target = options[0];
        } else if (this.algo === 'lc') {
          // console.log('here')
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


        // options[0].method = bReq.method;
        // options[0].path = bReq.url;
        // options[0].headers = bReq.headers;
        const serverOptions = {};
        serverOptions.method = bReq.method;
        serverOptions.path = bReq.url;
        serverOptions.headers = bReq.headers;
        serverOptions.hostname = target.hostname;
        serverOptions.port = target.port;

        // Call origin server!!!!!!
        // console.log(INDEXTEST, options[0].openRequests, options[1].openRequests, options[2].openRequests);
        target.openRequests += 1;
        const originServer = http.request(serverOptions, (sRes) => {
          console.log(sRes.headers);
          bRes.writeHead(200, sRes.headers);
          // if (sRes.headers['set-cookie']) {
          //   bRes.writeHead(200, {
          //     'Set-Cookie': sRes.headers['set-cookie'][0],
          //   });
          // }
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
