

var axios = require('axios');
var store = require('./store');
var counterurl;
function initRunner(url,storeFileName){
    counterurl = url;
    store.init(storeFileName);

}

function run(){


  request(options, function (error, response) {
    if (error) throw new Error(error);
    var data = JSON.parse(response.body);
    store.appendPlain(data.StatusSNS.Time+","+data.StatusSNS.E320.Power_in+"\n",config.minuteReportFile);
    });

    axios({
        method: 'get',
        url: counterurl,
        
      }).then((response)=>{
        if(response.status == 200){
            let datar = response.data;
            store.addRecord(datar.StatusSNS.E320.Total_in,datar.StatusSNS.E320.Total_out, datar.StatusSNS.Time);
            store.save();

        }
        
      })

}

module.exports ={
  initRunner,
  run
}
