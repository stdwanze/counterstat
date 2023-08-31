var nightly = require('./nightlyRunner');
var config = require('./config').config();


nightly.initRunner(config.counterUrl,config.storeFileName);
nightly.run();
