let hoyemiles = require('./hoyemiles');
let config = require('./config').config();
hoyemiles.init(config.dtuurl);
var store = require('./store');
store.init(config.hoyemilesstore);



async function run(){

    var json = await hoyemiles.getPowerDTU();
    let now = new Date();

    var records = store.getRecords();
    var last = records.dailyrecord.pop();
    if(last != null){ 
        if(new Date(last.date).getDate() === now.getDate())//same day
        {
            last.delivered < json.YieldDay.v ? store.addRecord(0, json.YieldDay.v, now) : store.addRecord(0, last.delivered, last.date);
        }
        else {
            store.addRecord(0, last.delivered, last.date);
            store.addRecord(0, json.YieldDay.v, now)
        }
    }
    else {
        store.addRecord(0, json.YieldDay.v, now);
    }

    store.save();

}

run();