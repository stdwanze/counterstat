
let currTop = null;

function manageCurrTop(ct){

   
    let day = new Date().getDay();
    if(currTop == null || currTop.date != day) { currTop = { date: day, val: ct }; return ct;}
    if(ct > currTop.val) currTop = { date: day, val: ct };
    else return currTop.val;
    
    return ct;
}


function getCurrPerf(store, sungrow, dtu, currCount){

    let dtuVal = manageCurrTop(parseInt(dtu.YieldDay.v) / 1000);

    let records = store.getRecords();
    let energy = sungrow.energy + dtuVal
    let cOut = currCount.data.StatusSNS.E320.Total_out
    let cIn = currCount.data.StatusSNS.E320.Total_in;
    let sungrowRaw = sungrow;
    cIn = cIn - records.totalconsumed;
    cOut = cOut - records.totaldelivered;
    let usedEnergy = energy - cOut;
    let totalEnergy = cIn + usedEnergy;

    let res = {
        totalConsumption: totalEnergy,
        ownConsumption : usedEnergy,
        autarchy : (usedEnergy/totalEnergy) * 100,
        delivered: cOut,
        grid: cIn,
        produced: energy,
        sungrowRaw: sungrowRaw
    }
    return res;
}

module.exports = {

    getCurrPerf
}