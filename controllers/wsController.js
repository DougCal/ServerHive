const WebSocket = require('ws');

module.exports = (server, port) => {
  const wss = new WebSocket.Server({ server });
  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      console.log(message);
      ws.send('got message: "' + message + '" from port ' + port);
    });
    ws.send('got you from ' + port);
  });
  console.log('run');
};
