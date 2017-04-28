const redis = require('redis');
const crypto = require('crypto');

const redisPort = 6379;
const host = '127.0.0.1';
const client = redis.createClient(redisPort, host);

client.on('connect', () => {
  console.log('redis connected');
});

const authController = {};

const hash = (string) => {
  const generatedHash = crypto.createHash('sha256')
    .update(string, 'utf8')
    .digest('hex');
  return generatedHash;
};

authController.login = (req, res) => {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  }).on('end', () => {
    //console.log(body);
    body = JSON.parse(body);
    if (body.username === 'yo' && body.password === 'yo') {
      const key = hash(body.username);
      client.set(key, body.username, (err, reply) => {
        //console.log(req.headers);
        res.writeHead(200, {
          'Set-Cookie': ('SID=').concat(key),
          'Content-Type': 'application/JSON',
        });
        res.end('true');
      });
    } else res.end('false');
  });
};

const cookieParse = (cookies, target = null) => {
  const cookieObj = {};
  let arr = cookies.split(';');
  arr = arr.map((value) => { return value.trim(' '); });
  // console.log(arr);
  let cookieSplit;
  for (let i = 0; i < arr.length; i += 1) {
    cookieSplit = arr[i].split('=');
    if (target === null) {
      cookieObj[cookieSplit[0]] = cookieSplit[1];
    } else if (cookieSplit[0] === target) return cookieSplit[1];
  }
  return target === null ? cookieObj : null;
};

authController.verifyUser = (req, cb) => {
  // console.log(cookieParse(req.headers.cookie));
  const key = cookieParse(req.headers.cookie, 'SID');
  if (key) {
    client.get(key, (err, reply) => {
      if (reply !== null) return cb(true);
      return cb(false);
    });
  } else return cb(false);
};

module.exports = authController;
