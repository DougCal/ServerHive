const http = require('http');
const path = require('path');
const fs = require('fs');
const cluster = require('cluster');

const port = process.argv[2];

if (cluster.isMaster) { console.log('cluster is master');
  const numWorkers = require('os').cpus().length/2;
  console.log('Master cluster setting up ' + numWorkers + ' workers...');
  for (let i = 0; i < numWorkers; i += 1) {
    cluster.fork();
  }
  cluster.on('online', function (worker) {
    console.log('Worker ' + worker.process.pid + ' is online');
  });
  cluster.on('exit', function (worker, code, signal) {
    console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
    console.log('Starting a new worker');
    cluster.fork();
  });
} else {
  http.createServer((req, res) => {
    console.log('pid', process.pid, 'handler start, blocking CPU');
    console.log('pid', process.pid, 'unblocked, responding');
    if (req.method === 'GET' && req.url === '/html') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
        res.end(data);
      });
    }
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('LOOK AT ME\n Server ' + port);
    }
  }).listen(port);
  console.log('Server running on port ' + port);
}

