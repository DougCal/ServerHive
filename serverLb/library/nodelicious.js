const threads = require('./clusterSwitch');
const rp = require('./loadBalancer');
const redis = require('./originServer');

const lb = {};

const lib = {
  threads,
  rp,
  redis,
};

lb.deploy = (featureLib, options) => {
  return lib[featureLib](options);
};

module.exports = lb;