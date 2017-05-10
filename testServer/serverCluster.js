const http = require('http');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
// const https = require('https');
// const cluster = require('cluster');
const mongooseSaver = require('./../controllers/routes');
const forkThreads = require('../serverLb/library/clusterSwitch');

const mongoURL = 'mongodb://localhost:27017/ServerHive';
mongoose.connect(mongoURL, err => {
  if (!err) console.log('connected to DB');
});

const port = process.argv[2];

// const secureOpts = {
//     key: fs.readFileSync('server-key.pem'),
//     cert: fs.readFileSync('server-crt.pem'),
//     ca: fs.readFileSync('ca-crt.pem'),
// };

// for testing https, add secureOpts above as the first argument
// inside the createServer method, and change http to https

// create a server
forkThreads(() => {
  http.createServer((req, res) => {
    console.log(`worker ${process.pid} is working`);

    mongooseSaver.update(process.pid);

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
});
