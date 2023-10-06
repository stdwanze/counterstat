const { WebSocket } = require("ws");

async function getPower(){
    try{
    let res = await getPowerinternal();
    console.log(res);

    return res;
    }
    catch(e)
    {
        console.log(e);
        return null;
    }
}

function getPowerinternal(){

    const promise = new Promise( (resolve, reject) =>{

        const wss = new WebSocket("ws://192.168.1.214:8082/ws/home/overview");

        wss.on('error', console.error);
        wss.on('open', function open() {
          wss.send( JSON.stringify({lang: "de", token: "", service: "connect"}));
        });

    
        wss.on('message', function message(data) {
          
            let token = null;
            let payload = JSON.parse(data); 
            if(payload.result_data.service == "connect") {
                token = payload.result_data.token;
        
                wss.send(JSON.stringify({lang: "en", token: token, service: "devicelist", type: "0", is_check_token : "0" }));
            }
            if(payload.result_data.service == "devicelist"){
        
                let devid = payload.result_data.list[0].dev_id;
                wss.send( JSON.stringify({lang: "en", token: token , service: "direct", dev_id: ""+devid }));
            }
            if(payload.result_data.service == "direct"){
                result = {};
        
                payload.result_data.list.forEach(element => {
                    result[element.name] = parseFloat(element.voltage) * parseFloat(element.current);
                });
        
                wss.close();
                resolve(result);
            }
        });
        

    });

    return promise
}

module.exports = {
    getPower
}