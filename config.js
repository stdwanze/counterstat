function config(){

    return {
        counterUrl: "http://192.168.1.98/cm?cmnd=status%2010",
        storeFileName: "store.txt",
        hoyemilesstore: "hoyemiles.txt",
        goeChargerUrl: "http://192.168.1.222",
        lastset: "lastset.txt",
        activator: "activator",
        minuteReportFile: "minutereport.csv",
        dtuurl: "http://192.168.1.107/",
        cooldown: "cooldown",
        car: "http://192.168.1.160:3000/lastvalparsed"
    }

}

module.exports = {
    config
}