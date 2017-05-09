const WebSocket = require('ws');
const eventEmitter = require('events');

class WsProxy extends eventEmitter {
  constructor() {
    super();
    this.openSockets = [];
    this.init = (server, options) => {
      const wss = new WebSocket.Server({ server });
      wss.on('connection', (clientWs) => {
        const messageQueue = [];
        let tunnelOpen = false;
        const targetWs = new WebSocket(('ws://').concat(options[0].hostname).concat(':').concat(options[0].port));
        clientWs.on('message', (message) => {
          if (tunnelOpen) {
            targetWs.send(message);
            console.log(message);
          } else {
            messageQueue.push(message);
          }
        });
        targetWs.on('open', () => {
          this.openSockets.push({
            client: clientWs,
            targetSocket: targetWs,
            targetServer: { hostname: options[0].hostname, port: options[0].port },
          });
          while (messageQueue.length > 0) {
            targetWs.send(messageQueue[0]);
            console.log(messageQueue.shift());
          }
          tunnelOpen = true;
          targetWs.on('message', (message) => {
            clientWs.send(message);
          });
          clientWs.on('close', () => {
            console.log('client disconnected');
            targetWs.close();
          });
          targetWs.on('close', () => {
            let serverIndex;
            const currServer = this.openSockets.filter((item, i) => {
              if (item.targetSocket === targetWs) {
                serverIndex = i;
                return true;
              }
            });
            // console.log(currServer);
            console.log(currServer[0].targetServer.port, ' disconnected');
            console.log(this.openSockets.length + ' open sockets');
            this.openSockets.splice(serverIndex, 1);
            clientWs.close();
          });
        });
      });
    };
  }
}

module.exports = new WsProxy();
