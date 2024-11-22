
var axios = require('axios');
let _url = "";
function setup(url){

    _url = url;
}


async function load(){
    
    let lastcar = await axios({
        method: 'get',
        url: _url,
        timeout: 10000
    });
    

    return lastcar.data;
}

module.exports ={
    setup,
    load
}
