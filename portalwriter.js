
const { getPower } = require('./sungrow');
const dtu = require('./hoyemiles');

var store = require('./store');
var io = require('./io');
var config = require('./config').config();
dtu.init(config.dtuurl);


async function  doIt(){
        let h = {}; h.Power = {}; h.Power.v = -1;
        // load sungrow
        let r =  await getPower();
        // load hms
        try { h = await dtu.getPowerDTU();} catch(e){ }
        let strings = {
            StringNorth : isNaN(r.MPPT2)? 0: r.MPPT2 ,
            StringSouth: isNaN(r.MPPT1)? 0: r.MPPT1,
            StringGarage: h.Power.v,
            Total: r.MPPT1 + r.MPPT2 + h.Power.v
        }
        strings.Total = isNaN(strings.Total)? 0: strings.Total;
        // load charger
        var content = io.read(config.lastset);
        content.load = content.charger != null? content.charger : 0;
        content.next = content.result != null? content.result.chargersetting: "off";
        content.overflow = content.charger != null?  (content.export == true? content.overflow*-1 : content.overflow) : content.overflow; 

        var html = io.readPlain("./portaltemplate.html").toString();

        function minLengthReturn(s,l){

            if(s.length < l){
                for(i = s.length ; i < l; i++)
                {
                    s+= " ";
                }

            }
            return s;
        }


        html = html.replace('{PVSUM}', minLengthReturn(strings.Total.toFixed(0),3));
        html = html.replace('{PVNorth}',strings.StringNorth.toFixed(0));
        html = html.replace('{PVSouth}', strings.StringSouth.toFixed(0));
        html = html.replace('{PVGarage}', strings.StringGarage.toFixed(0));
        
        html = html.replace('{Charge}', minLengthReturn(content.load.toFixed(0),3));
        html = html.replace('{Next}', content.next);
        
        html = html.replace('{overflow}', minLengthReturn(content.overflow.toFixed(0),3));
        
        io.writePlain(html,"./public/portal.html")

    }

doIt();