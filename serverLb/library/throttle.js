const ipAddresses = {};

module.exports = (bReq, bRes, delay) => {

  const throttle = (del) => { console.log('delay time is ' + del + ' ms');
    const previousCall = new Date().getTime();
    return () => {
      const time = new Date().getTime();
      return (time - previousCall) >= del;
    };
  }

  const ip = (bReq.headers['x-forwarded-for'] || '').split(',')[0]
      || bReq.connection.remoteAddress;
  // if ip address does exist in our list of client ip addresses
  // we want to make sure that they cannot make a request within 100 ms
  // of their previous request
  if (ipAddresses[ip] && !ipAddresses[ip]()) {
    ipAddresses[ip] = throttle(delay);
    return bRes.end('too soon yo');
  }
  ipAddresses[ip] = throttle(delay);
}
