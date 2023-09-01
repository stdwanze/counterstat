var axios = require('axios');
var store = require('./io');
var config = require('./config').config();


function isNotAllowedToRun(){

    let currentTime = new Date();
    if(currentTime.getHours() < 7 || currentTime.getHours() > 18) return true;
   

    return false;
}

async function run(){

    if(isNotAllowedToRun()) return;

    let counter = await axios({
        method: 'get',
        url: config.counterUrl
    });

    store.appendPlain(counter.data.StatusSNS.Time+","+counter.data.StatusSNS.E320.Power_in+"\n",config.minuteReportFile);
    
}

run();