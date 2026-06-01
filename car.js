const fs = require('fs');
const path = require('path');
const TronityConnector = require('./tronity/tronityconnector');

const conf = JSON.parse(fs.readFileSync(path.join(__dirname, 'tronity/conf.json'), 'utf8'));
const connector = new TronityConnector(conf.Tronity.clientId, conf.Tronity.clientSecret);

async function load() {
    try {
        await connector.authenticate();
        const vehicles = await connector.getVehicles();
        if (!vehicles || !vehicles.length) return null;
        return await connector.getLastRecord(vehicles[0].id);
    } catch (e) {
        console.log('tronity error: ' + e.message);
        return null;
    }
}

module.exports = { load };
