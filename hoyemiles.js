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
    state = res.data.total;

    return state;
}

module.exports ={
    init,
    getPowerDTU
}
