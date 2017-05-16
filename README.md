# Installation

```
$ npm install nodelb
```

# Features

### 1. Reverse-Proxy features such as :

 * Internal caching of static files and desired route responses

 * Internal health checks

 * Cache clearing mechanisms

### 2. Load-Balancing features such as :

 * Least-connections / round-robin load-balancing algorithm for http(s) and web sockets

### 3. Additional Features :
 
 * Error logging
 
 * IP throttling
 
 * Direct compability with Redis for session storage

 * Direct compability with the Node Cluster module for multi-threading Node instances

# Reverse Proxy Setup

Include our library in your application using:

```javascript
const lb = require(‘nodelb’);
```

## Options  —

Options is a collection of the addresses to the target servers, consisting of their hostnames and ports.
In order to create the reverse proxy object, it will need this input upon deployment.

### Example:

```javascript
const options = [
  {
    hostname: '127.0.0.1',
    port: 3000,
  },
  {
    hostname: '127.0.0.1',
    port: 4000,
  },
  {
    hostname: '127.0.0.1',
    port: 5000,
  },
];
```

## lb.deploy ( string, array( options ), function[optional] ) —

lb.deploy triggers the creation of the reverse proxy object.

**First parameter (string):** is a configuration argument for the reverse proxy server which in this case must be: ’rp’

**Second parameter (array):** will be the options collection created previously (see above)

**Third parameter (function) - optional:** callback function executed upon initializing objects for reverse-proxy

**‘rp’ is the only valid string input for the first parameter to trigger your reverse proxy setup**

### Example:
```javascript
const rp = lb.deploy(‘rp’, options);
```

lb.deploy has three specific strings that can be used in this library.

To see the other use cases and strings for lb.deploy in this library, click these links:

* [Websocket Deploy Section](https://github.com/DataHiveDJW/ServerHive/blob/master/README.md#websockets-setup)

* [Redis Deploy Section](https://github.com/DataHiveDJW/nodeLB/blob/master/README.md#redis-sessions-setup)

* [Multi-Threading Deploy Section](https://github.com/DataHiveDJW/nodeLB/blob/master/README.md#threads-setup)

## rp.addOptions ( options ) —

**Options (array of objects)**

You can use rp.addOptions to append your existing options collection. This method will not overwrite your previous collection.

### Example:

```javascript
const newOptions =
[
 { hostname: '127.0.0.1', port: '3000' },
 { hostname: '127.0.65.120', port: '4000' }
]
rp.addOptions(newOptions);
```

## rp.setRoutes ( nestedArray ) —

**The nestedArray parameter:** is stored in the reverse proxy server as an object of what routes in your application you would like cached upon first request.

Convention implies that you will declare this nestedArray as ‘routes’.
Each subarray of routes takes two strings: ‘method’ & ‘url’:

```javascript
const routes = [['method', 'URL'], ['method', 'URL']];
```

**Method (string):** are the usual type of requests (e.g. ‘GET’, ‘POST’, ‘DELETE’, ‘PUT’);

**URL (string):** will be the portion of your specific route (e.g. ‘/users’, ‘/puppies’);

rp.setRoutes can be called multiple times and will add the new routes to the routes cache

### Example:

```javascript
const routes = [['GET', '/puppies'], ['POST', '/login']];
```

## rp.init ( req , res, boolean, number[optional], number[optional] ) —

**This method sends/ends the response to the client**

This method initializes the reverse proxy.
The reverse proxy server will cache static files (.HTML, .CSS., .JS) & routes from rp.setRoutes method.

This method does the following:
Checks cache for existence of incoming ‘req’
Accepts ‘req’ and pipes it to target servers if it does not exist in cache
Receives ‘res’ back from target servers, appends header to response, and then pipes/ends response back to browser

**Third parameter (boolean):** to set up your protocol (http/https), put true for https for ssl encryption or false for http

### DDoS Considerations

***fourth parameter must be used with fifth parameter for the purpose of ip throttling***

**Fourth parameter (number) - optional:** milliseconds allowed between n (defined below) number of client requests per ip - 500 Server Error will result from violating ip throttling rules setup with fourth and fifth parameters.

**Fifth parameter (number) - optional:** number of requests per ip address allowed within duration set in fourth parameter before responding with a 500 Server Error.

### Example:

```javascript
const server = http.createServer((req, res) => {
 rp.init(req, res, false, 5000, 10);
}).listen(1337);
console.log('Server running at 127.0.0.1:1337');
```

## rp.healthCheck ( interval[optional] , ssl[optional]) —

rp.healthCheck sends pings from the reverse proxy to all target servers with a test requests to review target server health.
Uses internal boolean logic to toggle target servers as active or inactive based on results of pings.

**First parameter (number) - optional:** accepts an interval in ms (milliseconds)

**Second parameter (number) - optional:** accepts a boolean indicating whether the protocol is http or https.  This parameter defaults to false, setting an http protocol.  For https, set this parameter to true.

If the interval parameter is NULL, rp.healthCheck can be called by user discretion.
If interval has a value, rp.healthCheck will run on that given interval value (e.g. every 5 minutes).

### Example:

```javascript
// interval = 10000 milliseconds
rp.healthCheck(10000);

// interval is null
rp.healthCheck();
```

## rp.clearCache ( interval[optional] ) —

Accepts an interval parameter in ms (milliseconds).

rp.clearCache clears the internal cache of the reverse proxy server.

If the interval parameter is NULL, rp.clearCache can be called by user discretion for a one-time cache clear.
If interval has a value, rp.clearCache will run on that given interval value (e.g. every 5 minutes).

rp.clearCache is an integral method in this library ensure cached content is fresh. This method also aids in preventing the cache from consuming too much RAM in media heavy applications and bogging down the performance of the proxy server.

It is recommended to utilize this method in some capacity in your application.

### Example:

```javascript
// interval = 10000 milliseconds
rp.clearCache(10000);

// interval is null
rp.clearCache();
```
# Websockets Setup

The websockets feature extends http/https routing and load-balancing to websocket connections. There are two websockets options, pooling and non-pooling. The pooling option expects a pool id message from the client before connecting the persistent web socket tunnel to the appropriate target server handling that web socket pool. The non-pooling options creates persistent web socket tunnels with target servers on a least connection basis.

## lb.deploy ( string ) —

**First parameter (string):** is a configuration argument for the load-balance library which in this case must be: ’wspool’ to initialize websocket proxying for the pooling option or 'ws' for the non-pooling option 

### Example:
```javascript
const ws = lb.deploy(‘wspool'); // or lb.deploy(‘ws');
```

## ws.init ( server, options, boolean[optional] ) —
This method commences websocket routing. 

**server (previously instatiated http(s) server object)**

The server parameter expects the object returned from the http/https createServer method. The websockets feature leverages the same port as http/https server.

**options (array of objects)**

If further target server options are added, you can use rp.addOptions to update your existing options collection.
This method will not overwrite your previous collection.

**boolean (ssl flag)**

The third boolean parameter defaults to false. If ssl communication is required between proxy server and target servers, 'true' should be used for this argument.

**IMPORTANT NOTE ON POOLING FEATURE**
All web socket messages from client will be dropped until message is received with socketPoolId. Format of message must be "{'socketPoolId': 5}



### Example:
```javascript
const server = http.createServer((req, res) => {
 rp.init(req, res);
}).listen(1337);

ws.init(server, options, true);
```

# Error Log Setup

Handling a multitude of servers for your application requires constant monitoring of the health of each individual server. To coincide with our health check functionality, we provided some simple to use methods to create an error log path that can cleanly and readibly store the results of errors from health checks.

## errorLog.Init ( string ) --

Accepts a string as its sole parameter which provides your desired file path for the log file to be generated at.
This method will simply store the file path.

```javascript
errorLog.Init(path.join(__dirname + '/healthCheck.log'));
```

## errorLog.write ( object ) --

Accepts the error object as it's parameter to be written to the log file.
Method will read the previous copy of the file before re-writing it and concatinating the old data with the new data.

```javascript
res.on('end', () => {
// response from server received, reset value to true if prev false
 if (options[i].active === false) options[i].active = true;
 });
 }).on('error', (e) => {
        e.name = "HealthCheck Error";
        errorLog.write(e);
```

# Redis Sessions Setup

A Redis server must be setup as a prerequisite to utilizing the Redis Sessions object
[see Redis documentation for more information on setting up your personal Redis instance](https://redis.io/documentation)
The deploy method requires the Redis server address in the options argument (host/ip and port) and creates/returns the ‘rs’ (Redis sessions) object.

```javascript
const options = {
  host: '127.0.0.1', // —> string hostname or IP address
  port: 6379,        // —> integer port number
};

const lb = require(‘nodelb’);
const rs = lb.deploy(‘redis’, options);
```

## rs.authenticate(req, res, cookieKey, uniqueId, cb) // Authentication:

Encrypts and saves session cookie in Redis
Sets cookie in header (DOES NOT END RESPONSE)

**Req (object):** client request object

**Res (object):** client response object

**cookieKey (string):** name of cookie as seen in browser

**uniqueId (string):** uniqueId per cookieKey (e.g. username)

**Cb (function):** callback function executed after redis save - includes redis error and reply messages --

Example: `(err, reply) => {. . .}`

## rs.verifySession(req, cookieKey, cb) // VerifySession:
Parses cookies in request header
Validates session cookies against central redis store
Returns true or false based on cookie validity

**Req (object):** client request object

**cookieKey (string):** name of cookie as seen in browser (targets this cookie name exclusively when validating)

**Cb (function):** callback function with result argument true or false --

Example: `(sessionVerified) => {. . .}`

# Threads Setup
Since node is a single-threaded application natively, we provide the option to use all the threads on your target servers using the Node cluster module. Utilizing this module, the servers will be able to sustain a much higher load than when node is running single-threaded solely.

To make this more relative, say your target server is able to handle 100 requests before it breaks. On a Node server running with 4 threads, it will be able to handle about 200 requests before the server breaks.  Because of its significant impact in balancing load, we made this an option in our library.

The threads will balance requests from the reverse proxy server through the cluster module’s native round-robin algorithm (except on Windows).

See more details at [Node's Cluster Module Docs](https://nodejs.org/api/cluster.html#cluster_how_it_works)

A simple set up to getting threads started:

```javascript
const lb = require('nodelb');
const threads = lb.deploy(‘threads’);

const host = 'localhost';
const port = 3000;
threads(host, port);
```

**host (string):** string containing the host url

**port (number):** number indicating at what port will the thread respond to (e.g. localhost:3000)
