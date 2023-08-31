

var request = require('axios');
var store = require('./store');
var counterurl;
function initRunner(url,storeFileName){
    counterurl = url;
    store.init(storeFileName);
}

function run(){

    axios({
        method: 'get',
        url: counterurl,
        
      }).then((response)=>{
        if(response.status == 200){
            let datar = JSON.parse(response.data);
            store.addRecord(datar.StatusSNS.E320.total_in,datar.StatusSNS.E320.total_out, datar.StatusSNS.Time);
            store.save();

        }
        
      })

}