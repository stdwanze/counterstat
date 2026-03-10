let stats = require('./statanalyser');
const { getPower } = require('./sungrow');

async function run(){

/*    stats.init("http://192.168.1.160:5000");
    await stats.load();
    stats.analyse();
    stats.report();*/

    let res = await getPower();
    console.log(res);
}

run();