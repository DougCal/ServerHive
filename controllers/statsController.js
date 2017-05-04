const lbSession = require('../models/stats');

const statsController = {};

statsController.servers = [];
statsController.session = new Date();

statsController.createSession = (options) => {
  let server = {};
  server.serverId = 'Cached Response';
  server.requests = 0;
  statsController.servers.push(server);
  options.forEach((value) => {
    server = {};
    const serverId = value.hostname.concat(':').concat(value.port);
    server.serverId = serverId;
    server.requests = 0;
    statsController.servers.push(server);
  });
  const session = new lbSession({
    servers: statsController.servers,
  });
  session.save((err, document) => {
    if (err) console.log(err);
    statsController.session = document.session;
  });
};

statsController.countRequests = (serverId) => {
  console.log('COUNTEEDDDDD');
  // const serverId = options === 'lb' ? 'lb' : options[0].hostname.concat(':').concat(options[0].port);
  let currServer;
  statsController.servers.forEach((value) => {
    if (value.serverId === serverId) currServer = value;
  });
  currServer.requests += 1;
  if (currServer.requests % 1 === 0) {
    lbSession.findOneAndUpdate({ session: statsController.session }, { servers: statsController.servers }, (err, reply) => {
      console.log(err);
      console.log(reply);
    });
  }
};

statsController.getServerStats = (req, res) => {
  lbSession.find((err, documents) => {
    // const result = documents.reduce((acc, current) => {
    //   let obj = {};
    //   obj[current.session] = statsController.servers
    //   acc.push(obj);
    //   return acc;
    // }, []);
    res.end(JSON.stringify(documents));
  });
};

module.exports = statsController;
