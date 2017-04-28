const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/ServerHive');
const Schema = mongoose.Schema;

const threads = new Schema({
  threadID: Number,
  requests: Number,
});

const thread = mongoose.model('Thread', threads);

module.exports = thread;
