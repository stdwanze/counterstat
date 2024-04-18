function config(){

    return {
        counterUrl: "http://192.168.1.98/cm?cmnd=status%2010",
        storeFileName: "store.txt",
        hoyemilesstore: "hoyemiles.txt",
        goeChargerUrl: "http://192.168.1.224",
        lastset: "lastset.txt",
        activator: "activator",
        minuteReportFile: "minutereport.csv",
        dtuurl: "http://192.168.1.105/",
        cooldown: "cooldown"
    }
}

module.exports = {
    config
}