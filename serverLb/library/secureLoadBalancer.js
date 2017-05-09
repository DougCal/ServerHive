const https = require('https');
const EventEmitter = require('events');
const fs = require('fs');

class LoadBalancer extends EventEmitter {
  constructor() {
    super();
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

  setRoutes(routes) {
    for (let i = 0; i < routes.length; i++) {
      let temp = routes[i][0].concat(routes[i][1]);
      this.routes[temp] = true;
    }
  };

  addOptions(options) {
    this.options = this.options.concat(options);
  };

  healthCheck(interval = null) { console.log('went into healthCheck');
    /*
  15 minute interval healthcheck sends dummy get request to servers(ports) to check server health
  alters 'active' boolean value based on result of health check
    */
    // loops through servers in options & sends mock get request to each
    const options = this.options;

    for (let i = 0; i < options.length; i += 1) {
      https.get(options[i], (res) => { console.log('made a get request');
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
        this.healthCheck(interval);
      }, interval);
    }
  };

  clearCache(interval = null) {
    this.cache = {};
    if (interval !== null) {
      setTimeout(() => {
        this.clearCache(this.cache, interval);
      }, interval);
    }
  };

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
    if (this.shouldCache(bReq, routes) === true) {
      console.log('Successfully cached request result');
      // cache response
      cache[bReq.method + bReq.url] = body;
    }
  };

  init(bReq, bRes) {
    const options = this.options;
    const cache = this.cache;
    const routes = this.routes;

    console.log('it\'s in secureLoadBalancer');
    if (cache[bReq.method + bReq.url]) {
      console.log('went into the if in LoadBalancer');
      // STATS GATHERING
      // statsController.countRequests('lb');
      this.emit('cacheRes');

      console.log('Request response exists, pulling from cache');
      bRes.end(cache[bReq.method + bReq.url]);
    } else {
      console.log('went inside else of init method');
      // STATS GATHERING
      // statsController.countRequests(options[0].hostname.concat(':').concat(options[0].port));
      //this.emit('targetRes');
      let body = '';
      // check for valid request & edge case removes request to '/favicon.ico'
      if (bReq.url !== null && bReq.url !== '/favicon.ico') {
        // console.log('before options used: ', options);
        console.log(JSON.stringify(options));
        options.push(options.shift());
        while (!options[0].active) options.push(options.shift()); console.log('made it past while loop');
        options[0].method = bReq.method;
        options[0].path = bReq.url;
        options[0].headers = bReq.headers;
        // this is where https will have to happen
        // Call origin server!!!!!!

        const secureOpts = {
          hostname: options[0].hostname,
          port: options[0].port,
          path: options[0].path,
          method: options[0].method,
          key: fs.readFileSync('server-key.pem'),
          cert: fs.readFileSync('server-crt.pem'),
          ca: fs.readFileSync('ca-crt.pem'),
        };

        const originServer = https.request(secureOpts, (sRes) => {
          console.log('connected');
          sRes.on('data', (data) => {
            body += data;
            // bRes.write(data);
          });
          sRes.on('end', () => {
            this.cacheContent(body, cache, bReq, routes);
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

  lbInit(options, cb) {
    // console.log('init: ', options);
    this.options = options;
    // initialize options for STATS gathering
    // statsController.createSession(options);
    cb();
    return this;
  };
}

const loadBalancer = new LoadBalancer();

module.exports = loadBalancer.lbInit;
