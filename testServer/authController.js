const redis = require('redis');

const redisPort = 6379;
const host = '127.0.0.1';
const client = redis.createClient(redisPort, host);

client.on('connect', () => {
  console.log('redis connected');
});

let cookie = 1;
const authController = {};

authController.login = (req, res) => {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  }).on('end', () => {
    res.writeHead(200, { 'Content-Type': 'application/JSON' });
    body = JSON.parse(body);
    if (body.username === 'yo' && body.password === 'yo') {
      cookie += 1;
      client.set(cookie, body.username, (err, reply) => {
        console.log(reply);
        res.writeHead(200, {
          'Set-Cookie': ('session=').concat(cookie),
          'Content-Type': 'text/plain',
        });
        res.end('true');
      });
    } else res.end('false');
    // client.get('Darrick', (err, reply) => {
    //   console.log(reply);
    // })
  });
};

module.exports = authController;
