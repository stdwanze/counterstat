

function getCurrPerf(store, sungrow, dtu, currCount){

    let records = store.getRecords();
    let energy = sungrow.energy + parseInt(dtu.YieldDay.v) / 1000
    let cOut = currCount.data.StatusSNS.E320.Total_out
    let cIn = currCount.data.StatusSNS.E320.Total_in;

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
        produced: energy
    }
    return res;
}

module.exports = {

    getCurrPerf
}