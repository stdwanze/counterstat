
const Influx = require('influx')
var config = require('./config').config();

let powerPw = config.powerPw;

const influx = new Influx.InfluxDB({
  host: '192.168.1.89',
  port: 8086,                 // Standardport
  database: 'powerdata',    // deine Datenbank
  username: 'loggerPwr',           // optional
  password: powerPw,       // optional
})

 function writeGridEnergy(totalConsumption,ownConsumption,delivered,autarchy, time) {
    influx.getDatabaseNames()
    .then(names => {
        if (!names.includes('powerdata')) {
        return influx.createDatabase('powerdata')
        }
    })
    .then(() => {
        console.log('Verbindung hergestellt & Datenbank bereit.')


        // Beispiel: Datenpunkt schreiben
        return influx.writePoints([
        {
            measurement: 'GridEnergy',
            tags: { source: 'tasmota' },
            fields: { totalConsumption: totalConsumption, ownConsumption: ownConsumption, delivered: delivered, autarchy: autarchy },
            timestamp: time
        }
        ])
    })
    .catch(err => {
        
        console.error('Fehler:', err)
    })

}
 function writePVEnergy(sungrow,garage, time) {
    influx.getDatabaseNames()
    .then(names => {
        if (!names.includes('powerdata')) {
        return influx.createDatabase('powerdata')
        }
    })
    .then(() => {
        console.log('Verbindung hergestellt & Datenbank bereit.')


        // Beispiel: Datenpunkt schreiben
        return influx.writePoints([
        {
            measurement: 'pvEnergy',
            tags: { source: 'pv' },
            fields: { sungrow: sungrow,garage: garage },
            timestamp: time
        }
        ])
    })
    .catch(err => {
        
        console.error('Fehler:', err)
    })

}
 function writePV(total,north,south,garage, time) {
    influx.getDatabaseNames()
    .then(names => {
        if (!names.includes('powerdata')) {
        return influx.createDatabase('powerdata')
        }
    })
    .then(() => {
        console.log('Verbindung hergestellt & Datenbank bereit.')


        // Beispiel: Datenpunkt schreiben
        return influx.writePoints([
        {
            measurement: 'pv',
            tags: { source: 'pv' },
            fields: { total: total, north: north, south: south, garage: garage },
            timestamp: time
        }
        ])
    })
    .catch(err => {
        
        console.error('Fehler:', err)
    })

}
 function writeCharger(power,charged, time) {
    influx.getDatabaseNames()
    .then(names => {
        if (!names.includes('powerdata')) {
        return influx.createDatabase('powerdata')
        }
    })
    .then(() => {
        console.log('Verbindung hergestellt & Datenbank bereit.')


        // Beispiel: Datenpunkt schreiben
        return influx.writePoints([
        {
            measurement: 'chager',
            tags: { source: 'charger' },
            fields: { power: power, charged: charged },
            timestamp: time
        }
        ])
    })
    .catch(err => {
        
        console.error('Fehler:', err)
    })
};

async function getOutsideTemperature() {
    try {
        const result = await influx.query(
            `select mean("Aussentemperatur") as mean_temp from "powerdata"."autogen"."Heatpump" where time > now() - 1h limit 1`
        );
        if (result && result.length > 0 && result[0]) {
            return result[0].mean_temp.toFixed(1);
        }
        return 'N/A';
    } catch (err) {
        console.error('Temperature query error:', err);
        return 'N/A';
    }
}

module.exports = { writePV, writePVEnergy, writeGridEnergy, writeCharger, getOutsideTemperature };

