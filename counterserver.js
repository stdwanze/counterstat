const polka = require('polka');
const { json } = require('body-parser');
var store = require('./store');
var io = require('./io');
var config = require('./config').config();

polka()
    .use(json())
    .get('/stats', (req,res) =>{
        store.init(config.storeFileName);
        res.end(JSON.stringify(store.getRecords()));
    })
    .get('/activate', (req,res)=> {
        io.write({},config.activator);
        res.end("activated");
    })
    .get('/deactivate', (req,res)=> {
        io.deleteFile(config.activator);
        res.end("deactivated");
    })
    .get('/minutereport', (req,res)=>{
        var content = io.readPlain(config.minuteReportFile);
        res,end(content);
    })
    

    
    .listen(5000, err => {
        if (err) throw err;
        console.log(`> Running on localhost:3000`);
      });