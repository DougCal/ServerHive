const fs = require('fs');

const errorLog = {};


errorLog.Init = (path) => {
  errorLog.path = path;
}

errorLog.write = (error) => {
  if (errorLog.path) {
    fs.readFile(errorLog.path, (err, data) => {
      if (err) console.log(err, 'Read File error');
        let date = new Date();
        fs.writeFile(errorLog.path, data + date + ': ' + error + '\n', 'utf-8', (err) => {
          if (err) console.log(err, 'Write File error');
          else console.log('File written successfully');
        })
    })
  } else {
    return;
  }
}

module.exports = errorLog;