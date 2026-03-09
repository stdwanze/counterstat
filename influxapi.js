
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

async function getHeatpumpData() {
    try {
        const result = await influx.query(
            `select mean("Heisswasser") as heisswasser, mean("HeizungsPuffer") as heizungpuffer, mean("VerdichterLeistung") as verdichterleistung from "powerdata"."autogen"."Heatpump" where time > now() - 10m limit 1`
        );
        if (result && result.length > 0 && result[0]) {
            return {
                heisswasser: (result[0].heisswasser || 0).toFixed(1),
                heizungpuffer: (result[0].heizungpuffer || 0).toFixed(1),
                verdichterleistung: (result[0].verdichterleistung || 0).toFixed(0)
            };
        }
        return { heisswasser: 'N/A', heizungpuffer: 'N/A', verdichterleistung: 'N/A' };
    } catch (err) {
        console.error('Heatpump query error:', err);
        return { heisswasser: 'N/A', heizungpuffer: 'N/A', verdichterleistung: 'N/A' };
    }
}

async function getCompressorStatus() {
    try {
        const result = await influx.query(
            `select "VerdichterLeistung" from "powerdata"."autogen"."Heatpump" where time > now() - 5m order by time desc limit 1`
        );
        if (result && result.length > 0 && result[0] ) {
            const value = result[0].VerdichterLeistung;
            const isRunning = value > 0;
            return {
                isRunning: isRunning,
                value: value.toFixed(0),
                status: isRunning ? '●' : '○'
            };
        }
        return { isRunning: false, value: 'N/A', status: '○' };
    } catch (err) {
        console.error('Compressor status query error:', err);
        return { isRunning: false, value: 'N/A', status: '○' };
    }
}

module.exports = { writePV, writePVEnergy, writeGridEnergy, writeCharger, getOutsideTemperature, getHeatpumpData, getCompressorStatus };

