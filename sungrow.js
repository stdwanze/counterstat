const { WebSocket } = require("ws");
let semaphore = false;
let lastres = null;
async function getPower(){
    try{
    
    if(semaphore) return lastres;
    semaphore = true;
    
    let res = await getPowerinternal();
    lastres = res;
    console.log(res);

    semaphore = false;
    return res;
    }
    catch(e)
    {
        semaphore = false;
        console.log(e);
        return null;
    }
}

function getPowerinternal(){

    const promise = new Promise( (resolve, reject) =>{
        try {
            let result = {};
        const wss = new WebSocket("wss://192.168.1.85/ws/home/overview",{rejectUnauthorized: false});
                                   
        wss.on('error', (err) => {
            console.error('WebSocket error:', err);
            resolve({});
        });
        wss.on('open', function open() {
          wss.send( JSON.stringify({lang: "de", token: "", service: "connect"}));
        });

        let token = null;
        wss.on('message', function message(data) {
          
            try{
                let payload = JSON.parse(data); 
                if( payload.result_data != null) {
                    switch(payload.result_data.service)
                    {
                        case "connect" :  {
                            token = payload.result_data.token;
                            
                            wss.send(JSON.stringify({lang: "de_de", token: token, service: "login", passwd: "pw1111", username : "user" }));
                            break;
                        }
                        case "login" :  {
                            token = payload.result_data.token;
                            
                            wss.send(JSON.stringify({lang: "de_de", token: token, service: "devicelist", type: "0", is_check_token : "0" }));
                           // wss.send(JSON.stringify({lang: "en", token: token, service: "runtime"}));
                           
                            break;
                        }  
                        case "devicelist" : {
                           // token = payload.result_data.token;
                            let devid = ""+payload.result_data.list[0].dev_id;
                            let time = Date.now()
                          //  wss.send( JSON.stringify({lang: "de_de", token: token , service: "statistics"}));
                               wss.send( JSON.stringify({lang: "de_de", token: token , service: "direct", dev_id: devid, time123456: time }));
                            break;
                        }
                        case "direct": {
                           // token = payload.result_data.token;
                            payload.result_data.list.forEach(element => {
                                result[element.name] = parseFloat(element.voltage) * parseFloat(element.current);
                            });
                            wss.send( JSON.stringify({lang: "de_de", token: token , service: "statistics"}));
                            break;
                        }
                        case "real": {
                            // token = payload.result_data.token;
                             payload.result_data.list.forEach(element => {
                                 result[element.name] = parseFloat(element.voltage) * parseFloat(element.current);
                             });
                             wss.send( JSON.stringify({lang: "de_de", token: token , service: "statistics"}));
                             break;
                         }
                        case "runtime": {
                           /* payload.result_data.list.forEach(element => {
                                result[element.name] = parseFloat(element.voltage) * parseFloat(element.current);
                            });*/
                            wss.send( JSON.stringify({lang: "en", token: token , service: "statistics"}));
                            break;
                        }
                        case "statistics": {
    
                            if(payload.result_data.list[0].today_energy != null)
                            {
                                result["energy"] = parseFloat(payload.result_data.list[0].today_energy);
                            }
                            wss.close();
                            resolve(result);
                            break;
                        }
                        default: {
                            wss.close();
                            resolve(result);
                        }
                    }
                }
                else {
                    wss.close();
                    resolve(result);
                }
            }
            catch(error){
                wss.close();
                resolve(result);
            }
          
          

            
            
        });
        }
        catch(e){
            resolve({});
        }
       
        

    });

    return promise
}

module.exports = {
    getPower
} 