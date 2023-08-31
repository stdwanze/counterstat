


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
    let overflow = Math.abs(counter.Power_in - chargerWattage);

    if(overflow < 0 ) 
    {
            charger.setPower(overflow);
            store.write({ overflow: overflow , date: new Date(), charger: chargerWattage},config.lastset);
    }
    else {
        store.write({ overflow: 0 , date: new Date(), charger: chargerWattage},config.lastset);
    }

}

module.exports = {
    run
}
    
