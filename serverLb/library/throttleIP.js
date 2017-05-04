const ipAddresses = {};

module.exports = (bReq, bRes, delay) => {

  const ip = (bReq.headers['x-forwarded-for'] || '').split(',')[0]
      || bReq.connection.remoteAddress;
  // if ip address does exist in our list of client ip addresses
  // we want to make sure that they cannot make a request within 100 ms
  // of their previous request
  setTimeout(() => {
    delete ipAddresses[ip];
  }, delay);
  if (ipAddresses[ip]) return bRes.end('too soon yo');
  ipAddresses[ip] = true;
}
