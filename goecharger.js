
var axios = require('axios');

var baseurl = "";
var state = null;
var woffset = 0;


function init(baseUrl){

    baseurl= baseUrl;
}

function setOffset(W_Offset){
    woffset = W_Offset;
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
        url: 'api/status?filter=amp,psm,car,tpa',
        baseURL: baseurl
    });
    state = res.data;
}

async function getChargerConsumptionInWatts(){

    if(state == null) await queryState();
    return state.car == 2 ? state.tpa : 0;
}

async function setPower(pInWatts, considerPostponedStop){

    let _base = 2300 - woffset;

    let phases = 1;
    let amps = 10;
    let charge = 0;
    let postpone = false;
    if(pInWatts < _base){

        if(considerPostponedStop){
            postpone = true;
        }
        else charge = 1;
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
    if(pInWatts > _base+2000){
        phases = 2;
        amps = 6;
    }
    
    await set("frc",charge);
    await set("psm",phases);
    await set("amp",amps);
    
    return { chargersetting: "amp:"+amps+",psm:"+phases+",chargeStoped:"+charge, commandStop: postpone, woffset: woffset};
       
}

module.exports = {
    init,
    getChargerConsumptionInWatts,
    setPower,
    setOffset
}