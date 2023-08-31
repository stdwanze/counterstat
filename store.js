var io = require('./io');

var current = null;
var filename = null;
function init(storename){

    filename = storename;
    current = io.read(filename);
    if(current.totalconsumed == undefined){
        current.totalconsumed = 0;
    }
    if(current.totaldelivered == undefined){
        current.totaldelivered = 0;
    }
    if(current.dailyrecord == undefined){
        current.dailyrecord = [];
    }
}

function getRecords(){
    return current;
}

function addRecord(totalconsumed, totaldelivered, date){

    var record = {
        date : date,
        consumed : totalconsumed - current.totalconsumed,
        delivered : totaldelivered - current.totaldelivered
    }
    current.totalconsumed = totalconsumed;
    current.totaldelivered = totaldelivered;
    current.dailyrecord.push(record);

}


function save(){
    io.write(current, filename);
}


module.exports = {
    init,
    save,
    getRecords,
    addRecord
}
