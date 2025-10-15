

var writeCharger = require('./influxapi.js').writeCharger;
var axios = require('axios');
var store = require('./io');
var config = require('./config').config();
var charger = require('./goecharger');
charger.init(config.goeChargerUrl);
var counterurl = config.last30smedian;

if(!store.exists(config.lastset)) store.write({},config.lastset);
if(!store.exists(config.cooldown)) store.write({ periodsLeft: 0 },config.cooldown);



function isNotAllowedToRun(){

    let currentTime = new Date();
    if(currentTime.getHours() < 6 || currentTime.getHours() > 18) return true;
    if(!store.exists(config.activator)){
        return true;
    } 
    let offset = store.read(config.activator);
    offset = parseInt(offset.offset);
    if(!isNaN(offset) && offset != -1 ) charger.setOffset(offset);
 
    return false;
}


function cooldown(){
    let cd = store.read(config.cooldown);
    if(cd.periodsLeft > 0){
        cd.periodsLeft -= 1;
        console.log("periods down to "+ cd.periodsLeft);
    } 
    store.write(cd,config.cooldown);
}
function is3PhaseActivatable(chargerWattage){
    let cd = store.read(config.cooldown);
    
    if(cd.periodsLeft < 1) return true;
    if(chargerWattage > 4200) return true;
    return false;

}
function setCooldown(){
    let cd = store.read(config.cooldown);
    cd.periodsLeft = 10;
    store.write(cd,config.cooldown);
    console.log("cool down set to 10");
}

function shouldStop(){
    let lastset = store.read(config.lastset);
    if(lastset.result != null ){
       if(lastset.result.commandStop == true) return true;
    }
    return false;
}

async function run(){

    let allowed = true;
    if(isNotAllowedToRun()) {
        allowed=false;
        
    }
    cooldown();

    let counter = await axios({
        method: 'get',
        url: counterurl,
    });
    let result = null;
    let chargerData = await charger.getChargerConsumptionInWattsAndWh();
    let chargerWattage = chargerData.load;
    
    let overflow = counter.data.median30s;



    if(!allowed)
    {
        store.write({ state: "did not run because not allowed", overflow: overflow,chargerOn: chargerWattage, charged: chargerData.charged },config.lastset);
        return;
    }


    overflow = overflow - chargerWattage;

    let stopCommandLastTime = shouldStop();
    let wasCharging = chargerWattage > 0 ;
    charger.setThreePhaseAllowed(is3PhaseActivatable(chargerWattage));
    console.log("3p possible? : " +is3PhaseActivatable(chargerWattage));
    if(overflow < 0 ) 
    {       overflow = Math.abs(overflow);
            result = await charger.setPower(overflow,stopCommandLastTime ? false : wasCharging  );
            store.write({export: true, overflow: overflow , date: new Date(), charger: chargerWattage,charged: chargerData.charged , result: result},config.lastset);
           
    }   
    else {
        
        if(stopCommandLastTime){
            result = await charger.setPower(-1,false);
        }
        else{
            result = await charger.setPower(-1,wasCharging);
        }
       
        store.write({ export: false,overflow: overflow , date: new Date(), charger: chargerWattage, charged: chargerData.charged ,result: result} ,config.lastset);
        
    }
    console.log("charger set "+ JSON.stringify(result));
    if(chargerWattage > 4200 && result.threePhase == false) setCooldown();
    writeCharger(chargerWattage,chargerData.charged, new Date());

}

run();
    
