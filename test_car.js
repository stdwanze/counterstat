const car = require('./car');

async function run() {
    console.log('fetching car data...');
    const data = await car.load();
    if (!data) {
        console.error('no data returned');
        process.exit(1);
    }
    console.log('raw response:', JSON.stringify(data, null, 2));
    console.log('---');
    console.log('SoC (level):  ', data.level, '%');
    console.log('Range:        ', data.range, 'km');
    console.log('Odometer:     ', data.odometer, 'km');
    console.log('Charging:     ', data.charging);
    console.log('Plugged:      ', data.plugged);
    console.log('Charger power:', data.chargerPower, 'kW');
    console.log('Status:       ', data.status);
    console.log('Last update:  ', new Date(data.lastUpdate).toLocaleString());
}

run().catch(e => {
    console.error('error:', e.message);
    process.exit(1);
});
