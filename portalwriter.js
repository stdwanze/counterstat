
const { getPower } = require('./sungrow');

var axios = require('axios');
const dtu = require('./hoyemiles');
const car = require('./car');
var store = require('./store');
var io = require('./io');

var config = require('./config').config();
dtu.init(config.dtuurl);
car.setup(config.car);

function refresh(){
    var html = io.readPlain("./refreshtemplate.html").toString();
    io.writePlain(html,"./public/portal.html")


}
function setChart(){
    var html = io.readPlain("./charttemplate.html").toString();
    io.writePlain(html,"./public/portal.html")

    
}


function isRefreshTime(){
    let m = new Date();
    let ret = false;
    m.getMinutes() == 30 ? ret= true: ret= false;
    return ret;
}
function isChartTime(){
    let m = new Date();
    let ret = false;
    m.getMinutes() % 5 == 0 ?  ret= true: ret= false;
    return ret;
}


async function  doIt(){

        console.log("start: " + new Date());
        if(isRefreshTime()) {
            refresh();

            return;
        }
        if(isChartTime()) {
            setChart();
            return;
        }
        // load performance
        let performace = await axios({
            method: 'get',
            url: config.performance,
        });

         console.log("got Performance: " + new Date());
        let h = {}; h.Power = {}; h.Power.v = -1;
        // load sungrow
        let r =  performace.data.sungrowRaw;//await getPower();
        // load hms
        try { h = await dtu.getPowerDTU();} catch(e){  h.YieldDay = { v : -1 };}
        let strings = {
            StringNorth : isNaN(r.MPPT2) || r.MPPT1 == null ? 0: r.MPPT2 ,
            StringSouth: isNaN(r.MPPT1) || r.MPPT2 == null? 0: r.MPPT1,
            StringGarage: h.Power.v,
            Total: r.MPPT1 + r.MPPT2 + h.Power.v,
            Energy: r.energy,
            Dtu: parseInt(h.YieldDay.v) / 1000

        }
        strings.Total = isNaN(strings.Total)? 0: strings.Total;
        // load charger
        var content = io.read(config.lastset);
        content.load = content.charger != null? content.charger : content.chargerOn;
        content.next = content.result != null? content.result.chargersetting: "off";
        content.next = content.next.replace("psm", "p");
        content.next = content.next.replace("amp", "a");
        content.next = content.next.replace("chargeStoped", "stop");
        content.threephase = content.result != null? content.result.threePhase : false;
        content.overflow = content.charger != null?  (content.export == true? (content.overflow-content.load)*-1 : content.overflow) : content.overflow; 
        content.charged = content.charged;

        

        //load car
        let lastCar = await car.load();
        if(lastCar != null){
            lastCar.batTemp = ((lastCar.battemplow + lastCar.battemphigh)/2).toFixed(1);
        }
        else {
            lastCar = {};
         
        }
        var html = io.readPlain("./portaltemplate.html").toString();

        function minLengthReturn(s,l){

            if(s.length < l){
                let adds = "<font color='white'>";
                for(i = s.length ; i < l; i++)
                {
                    adds+= "-";
                }
                adds += "</font>";
                s = adds+s;
            }
            return s;
        }


        html = html.replace('{PVSUM}', minLengthReturn(strings.Total.toFixed(0),4));
        html = html.replace('{PVNorth}',strings.StringNorth.toFixed(0));
        html = html.replace('{PVSouth}', strings.StringSouth.toFixed(0));
        html = html.replace('{PVGarage}', strings.StringGarage.toFixed(0));
        
        html = html.replace('{Charge}', minLengthReturn(content.load.toFixed(0),4));
        html = html.replace('{Next}', content.next);
        html = html.replace('{charged}', content.charged);
        
        html = html.replace('{overflow}', minLengthReturn(content.overflow.toFixed(0),0));
        html = html.replace('{energy}', minLengthReturn(strings.Energy.toFixed(1),0));
        html = html.replace('{dtu}', minLengthReturn(strings.Dtu.toFixed(3),0));
        html = html.replace('{sum}', minLengthReturn(performace.data.ownConsumption.toFixed(1)+performace.data.delivered.toFixed(1),0));
        
        html = html.replace('{DateTime}',  new Date().toLocaleString());
        html = html.replace('{consumption}', minLengthReturn(performace.data.totalConsumption.toFixed(1),0));
        html = html.replace('{autarchy}', minLengthReturn(performace.data.autarchy.toFixed(1),0));
        html = html.replace('{ownuse}', minLengthReturn(performace.data.ownConsumption.toFixed(1),0));
        html = html.replace('{deliver}', minLengthReturn(performace.data.delivered.toFixed(1),0));
        
        html = html.replace('{carState}', lastCar.state== "moving"? ".": "");
        html = html.replace('{SoC}', lastCar.soc);
        html = html.replace('{Range}',lastCar.range);
        html = html.replace('{Temp}',lastCar.batTemp);
        
      


        io.writePlain(html,"./public/portal.html")

         console.log("end: " + new Date());
    }

doIt();