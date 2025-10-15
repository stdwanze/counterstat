
const Influx = require('influx')
const config = require('./config.js');

let powerPw = config().powerPw;

const influx = new Influx.InfluxDB({
  host: '192.168.1.55',
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


        console.log(`Schreibe Datenpunkt: Wert=${val}, Zeit=${time.toISOString()}`);
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


        console.log(`Schreibe Datenpunkt: Wert=${val}, Zeit=${time.toISOString()}`);
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


        console.log(`Schreibe Datenpunkt: Wert=${val}, Zeit=${time.toISOString()}`);
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


        console.log(`Schreibe Datenpunkt: Wert=${val}, Zeit=${time.toISOString()}`);
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

module.exports = { writePV, writePVEnergy, writeGridEnergy, writeCharger };

