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

  cluster.on('online', (worker) => {
    // let user know thread is online
    console.log('Worker ' + worker.process.pid + ' is online');
    // open clusterRequests.json so we can store the threadID, and save it as 0
    // the value is 0 because no requests were made to this thread yet
    fs.readFile(path.join(__dirname, '../clusterRequests.json'), (err, data) => {
      if (err) throw err;
      let config = JSON.parse(data);

      // because of nodemon constantly restarting for whenever the json file is
      // changed, here is an if statement to make it a new empty array for when
      // its length equals the number of threads on the user's CPU
      if (config.length >= numWorkers) config = [];
      const obj = {};
      obj[worker.process.pid] = 0;
      config.push(obj);
      const configJSON = JSON.stringify(config);
      fs.writeFile(path.join(__dirname, '../clusterRequests.json'), configJSON, (err) => {
        if (err) throw err;
      });
    });
  });

  // when a worker dies executing code, create another
  cluster.on('exit', (worker, code, signal) => {
    console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
    console.log('Starting a new worker');
    cluster.fork();
    // fs.readFile(path.join(__dirname, '../clusterRequests.json'), (err, data) => {
    //   if (err) throw err;
    //
    //   const con = JSON.parse(data);
    //
    //   const threadToChange = con.findIndex(e => e.hasOwnProperty(process.pid.toString()));
    //
    //   con.splice(threadToChange, 1);
    //   const conJSON = JSON.stringify(con);
    //   fs.writeFile(path.join(__dirname, '../clusterRequests.json'), conJSON, (err) => {
    //     if (err) throw err;
    //   });
    // });
  });
} else {
  // create a server
  http.createServer((req, res) => {
    console.log(`worker ${process.pid} is working`);

    // open clusterRequests file to find the thread property, and then
    // add 1 to its value since a request has been made to that thread
    fs.readFile(path.join(__dirname, '../clusterRequests.json'), (err, data) => {
      if (err) throw err;

      const con = JSON.parse(data);
      const threadToChange = con.findIndex(e => e.hasOwnProperty(process.pid.toString()));

      if (threadToChange > -1) { console.log(`worker ${process.pid} passed if statement`)
        con[threadToChange][process.pid.toString()]++;
        fs.writeFile(path.join(__dirname, '../clusterRequests.json'), JSON.stringify(con), (err) => {
          if (err) throw err;
        });
      } else {
        const newObj = {};
        newObj[process.pid] = 1;
        con.push(newObj);
        fs.writeFile(path.join(__dirname, '../clusterRequests.json'), JSON.stringify(con), (err) => {
          if (err) throw err;
        });
      }
    });
    // send html file on a get request
    if (req.method === 'GET' && req.url === '/html') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.readFile(path.join(__dirname, '../index.html'), (err, data) => {
        console.log(data);
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
