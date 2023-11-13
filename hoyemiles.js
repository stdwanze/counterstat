var axios = require('axios');

var baseurl = "";
var state = null;
var woffset = 0;


function init(baseUrl){

    baseurl= baseUrl;
}


async function getPowerDTU(){

    let res = await axios({
        method: 'get',
        url: 'api/livedata/status',
        baseURL: baseurl
    });
    if(res.data != null && res.data.total != null){
        state = res.data.total;
    }
    else state = { Power: { v: 0}};
    return state;
}

module.exports ={
    init,
    getPowerDTU
}
