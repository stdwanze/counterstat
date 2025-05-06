
var axios = require('axios');

var baseurl = "";
var state = null;
var woffset = 0;
var threePhaseAllowed = false;

function init(baseUrl){

    baseurl= baseUrl;
}

function setOffset(W_Offset){
    woffset = W_Offset;
}
function setThreePhaseAllowed( allowed)
{
    threePhaseAllowed = allowed;
}

async function set(what,val){

    let res = await axios({
        method: 'get',
        url: 'api/set?'+what+"="+val,
        baseURL: baseurl
    });
}

async function  queryState()  {

    let res = await axios({
        method: 'get',
        url: 'api/status?filter=amp,psm,car,tpa,frc,wh',
        baseURL: baseurl
    });
    state = res.data;
}

async function getChargerConsumptionInWatts(){

    if(state == null) await queryState();
    return state.car == 2 ? state.tpa : 0;
}
async function getChargerConsumptionInWattsAndWh(){

    if(state == null) await queryState();
    let res = { load: state.car == 2 ? state.tpa : 0 , charged: Math.floor(state.wh)/1000}

    return res;
}

async function setPower(pInWatts, considerPostponedStop ){

    let _base = 2300 - woffset;
    let minChargelevel = 1400;
    let phases = 1;
    let amps =6;
    let charge = 0;
    let postpone = false;
    if(pInWatts < minChargelevel){

        if(considerPostponedStop){
            postpone = true;
        }
        else charge = 1;
    }
    if(pInWatts > minChargelevel){ // offset not deducted below
        phases = 1;
        amps = 6;
    } 
    if(pInWatts > _base+50){
        phases = 1;
        amps = 10;
    } 
    if(pInWatts > _base+300){
        phases = 1;
        amps = 12;
    } 
    if(pInWatts > _base+900){
        phases = 1;
        amps = 14;
    }
    if(pInWatts > _base+2000 && threePhaseAllowed){
        phases = 2;
        amps = 6;
    }
    
    if(state==null) await getChargerConsumptionInWatts();
    if(state.frc != charge) await set("frc",charge);
    if(state.psm != phases) await set("psm",phases);
    if(state.amp != amps) await set("amp",amps);
    
    return { chargersetting: "amp:"+amps+",psm:"+phases+",chargeStoped:"+charge, commandStop: postpone, woffset: woffset, threePhase: phases==2? true: false};
       
}

module.exports = {
    init,
    getChargerConsumptionInWatts,
    getChargerConsumptionInWattsAndWh,
    setPower,
    setOffset,
    setThreePhaseAllowed
}