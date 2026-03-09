
var axios = require('axios');
let baseURL = "";
let state = null;
let monthly_data = null;
function init(baseurl){
    baseURL = baseurl;
}



async function load(){

    let res = await axios({
        method: 'get',
        url: '/stats',
        baseURL: baseURL
    });
    state = res.data;



}

function analyse(){

    if( state == null) return;

    monthly_data = [{ month: -1}];

    state.dailyrecord.forEach(element => {
        let currMonth= monthly_data[monthly_data.length-1].month;
        
        let d = new Date(element.date);
        if(d.getMonth() != currMonth) {
            monthly_data.push({month: d.getMonth(), consumed: 0, delivered: 0});
        };

        let curr = monthly_data[monthly_data.length-1];
        curr.consumed += element.consumed;
        curr.delivered += element.delivered


    });


}

function report(){
    console.dir(monthly_data,-1)
}

module.exports = {
    report,
    analyse,
    init,
    load
}