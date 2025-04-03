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
        let result = {};
        const wss = new WebSocket("wss://192.168.1.214/ws/home/overview",{rejectUnauthorized: false});
                                   
        wss.on('error', console.error);
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
        

    });

    return promise
}

module.exports = {
    getPower
} 