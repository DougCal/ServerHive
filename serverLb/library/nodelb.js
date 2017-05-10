const threads = require('./clusterSwitch');
const rp = require('./secureLoadBalancer');
const redis = require('./originServer');

const lb = {};

const lib = {
  threads,
  rp,
  redis,
};

lb.deploy = (featureLib, options, cb) => {
  return lib[featureLib](options, cb);
};

module.exports = lb;
