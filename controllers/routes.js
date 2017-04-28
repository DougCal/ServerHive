const Thread = require('../models/threads.js');
const mongo = require('mongodb').MongoClient;
const mongoURL = 'mongodb://localhost:27017/ServerHive';


const save = (threadNum) => {

  const thread = new Thread({
    threadID: threadNum,
    requests: 0,
  });

  thread.save(); console.log('thread saved');
  // cpu.findOneAndUpdate({"port": port}, { $set: {"threads"[threadNum] = 0 }); console.log('saved to db');
}

const update = (thread) => { console.log('went into update');
  mongo.connect(mongoURL, (err, db) => {
    db.collection('threads').findOneAndUpdate({ threadID: thread }, { $inc: { requests: 1 } });
  });
}

module.exports = { save, update };
