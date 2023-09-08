const polka = require('polka');
const { join } = require('path');
const { json } = require('body-parser');
var store = require('./store');
var io = require('./io');
var config = require('./config').config();
const dir = join(__dirname, 'public');
const serve = require('serve-static')(dir);

polka()
    .use(json())
    .use(serve)
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
        res.end(content);
    })
    .get('/chargecontrol', (req,res)=>{
        var content = io.readPlain(config.lastset);
        res.end(content);
    })
    

    
    .listen(5000, err => {
        if (err) throw err;
        console.log(`> Running on localhost:5000`);
      });