const http = require('http');
const path = require('path');
const fs = require('fs');
const cluster = require('cluster');

const port = process.argv[2];

// when the server starts, it checks if the server is the master of the threads
if (cluster.isMaster) { console.log('cluster is master');
  const numWorkers = require('os').cpus().length;
  console.log('Master cluster setting up ' + numWorkers + ' workers...');
  // creates workers for threads based on threads
  for (let i = 0; i < numWorkers; i += 1) {
    cluster.fork();
  }
  // let the user know the id of the thread worker
  cluster.on('online', function (worker) {
    console.log('Worker ' + worker.process.pid + ' is online');
  });

  // when a worker dies executing code, create another
  cluster.on('exit', function (worker, code, signal) {
    console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
    console.log('Starting a new worker');
    cluster.fork();
  });
} else {
  // create a server
  http.createServer((req, res) => {
    console.log(`worker ${process.pid} is working`);
    // send html file on a get request
    if (req.method === 'GET' && req.url === '/html') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
        res.end(data);
      });
    }
    // for when using a proxy server, state back the port the user is on
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('LOOK AT ME\n Server ' + port);
    }
  }).listen(port);
  console.log('Server running on port ' + port);
}
