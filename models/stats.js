const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/ServerHive', (err) => {
  if (err) return console.log(err);
  console.log('mongo connected');
});

const Schema = mongoose.Schema;


const lbSchema = new Schema({
  session: { type: Date, default: Date.now() },
  servers: [{
    serverId: String,
    requests: Number,
  }],
});

module.exports = mongoose.model('lbSchema', lbSchema);
