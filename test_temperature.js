const { getOutsideTemperature, getHeatpumpData, getCompressorStatus } = require('./influxapi.js');

async function testTemperature() {
    console.log('Testing getOutsideTemperature()...');
    console.log('Start time:', new Date().toLocaleString());
    
    try {
        const temp = await getOutsideTemperature();
        console.log('Outside Temperature:', temp, '°C');
        console.log('Test passed ✓');
    } catch (err) {
        console.error('Test failed:', err);
    }
    
    console.log('End time:', new Date().toLocaleString());
}

async function testHeatpumpData() {
    console.log('\nTesting getHeatpumpData()...');
    console.log('Start time:', new Date().toLocaleString());
    
    try {
        const data = await getHeatpumpData();
        console.log('Heisswasser (Hot Water):', data.heisswasser, '°C');
        console.log('Heizungpuffer (Buffer):', data.heizungpuffer, '°C');
        console.log('Verdichterleistung:', data.verdichterleistung, '%');
        console.log('Test passed ✓');
    } catch (err) {
        console.error('Test failed:', err);
    }
    
    console.log('End time:', new Date().toLocaleString());
}

async function testCompressorStatus() {
    console.log('\nTesting getCompressorStatus()...');
    console.log('Start time:', new Date().toLocaleString());
    
    try {
        const status = await getCompressorStatus();
        console.log('Compressor Running:', status.isRunning);
        console.log('Compressor Value:', status.value, '%');
        console.log('Compressor Status Symbol:', status.status);
        
        if (status.isRunning) {
            console.log('✓ Compressor is RUNNING');
        } else {
            console.log('○ Compressor is STOPPED');
        }
        console.log('Test passed ✓');
    } catch (err) {
        console.error('Test failed:', err);
    }
    
    console.log('End time:', new Date().toLocaleString());
}

async function runAllTests() {
    await testTemperature();
    await testHeatpumpData();
    await testCompressorStatus();
    console.log('\n=== All tests completed ===');
}

runAllTests();
