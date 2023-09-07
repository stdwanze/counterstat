


var axios = require('axios');
var store = require('./io');
var config = require('./config').config();
var charger = require('./goecharger');
charger.init(config.goeChargerUrl);
var counterurl = config.counterUrl;
if(!store.exists(config.lastset)) store.write({},config.lastset);


function isNotAllowedToRun(){

    let currentTime = new Date();
    if(currentTime.getHours() < 8 || currentTime.getHours() > 17) return true;
    if(!store.exists(config.activator)) return true;

    return false;
}

async function run(){

    if(isNotAllowedToRun()) {
        store.write({ state: "did not run because not allowed"},config.lastset);
        return;
    }
    let counter = await axios({
        method: 'get',
        url: counterurl,
    });
    let chargerWattage = await charger.getChargerConsumptionInWatts();
    let overflow = counter.data.StatusSNS.E320.Power_in - chargerWattage;
    if(overflow < 0 ) 
    {       overflow = Math.abs(overflow);
            let result = charger.setPower(overflow);
            store.write({export: true, overflow: overflow , date: new Date(), charger: chargerWattage, result: result},config.lastset);
    }
    else {
        let result = charger.setPower(-1);
        store.write({ export: false,overflow: overflow , date: new Date(), charger: chargerWattage,result: result} ,config.lastset);
    }

}

run();
    
