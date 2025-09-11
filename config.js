function config(){

    return {
        counterUrl: "http://192.168.1.223/cm?cmnd=status%2010",
        storeFileName: "store.txt",
        hoyemilesstore: "hoyemiles.txt",
        goeChargerUrl: "http://192.168.1.146",
        lastset: "lastset.txt",
        activator: "activator",
        minuteReportFile: "minutereport.csv",
        dtuurl: "http://192.168.1.106/",
        cooldown: "cooldown",
        car: "http://192.168.1.160:3000/lastvalparsed",
        performance: "http://192.168.1.160:5000/currDayPerformance",
        last30smedian: "http://192.168.1.164:3001/median30s"
    }

}

module.exports = {
    config
}