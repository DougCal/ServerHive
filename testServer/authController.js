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
    //console.log(body);
    body = JSON.parse(body);
    if (body.username === 'yo' && body.password === 'yo') {
      cookie += 1;
      client.set(cookie, body.username, (err, reply) => {
        //console.log(req.headers);
        res.writeHead(200, {
          'Set-Cookie': ('session=').concat(cookie),
          'Content-Type': 'application/JSON',
        });
        res.end('true');
      });
    } else res.end('false');
  });
};

authController.verifyUser = (req, cb) => {
  if (req.headers.cookie && req.headers.cookie.slice(0, 7) === 'session') {
    const key = req.headers.cookie[req.headers.cookie.length - 1];
    client.get(key, (err, reply) => {
      if (reply !== null) return cb(true);
      return cb(false);
    });
  } else return cb(false);
};

module.exports = authController;
