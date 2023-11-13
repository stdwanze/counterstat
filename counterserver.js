const polka = require('polka');
const { join } = require('path');
const { json } = require('body-parser');
const { getPower } = require('./sungrow');
const dtu = require('./hoyemiles');

var store = require('./store');
var io = require('./io');
var config = require('./config').config();
const dir = join(__dirname, 'public');
const serve = require('serve-static')(dir);
dtu.init(config.dtuurl);

polka()
    .use(json())
    .use(serve)
    .get('/stats', (req,res) =>{
        store.init(config.storeFileName);
        res.end(JSON.stringify(store.getRecords()));
    })
    .get('/activate/:limit', (req,res)=> {
        io.write({ offset: req.params.limit},config.activator);
        res.end("activated");
    })
    .get('/deactivate/:mode', (req,res)=> {
        io.deleteFile(config.activator);

        if(req.params.mode != null){

        }

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
    .get('/currSolar', async  (req,res)=>{
        let r =  await getPower();
        let h = await dtu.getPowerDTU();
        let strings = {
            StringNorth : r.MPPT2,
            StringSouth: r.MPPT1,
            StringGarage: h.Power.v,
            Total: r.MPPT1 + r.MPPT2 + h.Power.v
        }

        res.end(JSON.stringify(strings));
    })
    
    

    
    .listen(5000, err => {
        if (err) throw err;
        console.log(`> Running on localhost:5000`);
      });