
var axios = require('axios');

var baseurl = "";
var state = null;



function init(baseUrl){

    baseurl= baseUrl;
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

async function setPower(pInWatts){

    let phases = 1;
    let amps = 10;
    let charge = 0;
    if(pInWatts < 2300){
        charge = 1;
    }
    if(pInWatts > 2300){
        phases = 1;
        amps = 10;
    } 
    if(pInWatts > 2800){
        phases = 1;
        amps = 12;
    } 
    if(pInWatts > 3200){
        phases = 1;
        amps = 14;
    }
    if(pInWatts > 4300){
        phases = 2;
        amps = 6;
    }
    
    await set("frc",charge);
    await set("psm",phases);
    await set("amp",amps);
    
    return "amp:"+amps+",psm:"+phases+",chargeStoped:"+charge;
       
}

module.exports = {
    init,
    getChargerConsumptionInWatts,
    setPower
}