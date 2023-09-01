function config(){

    return {
        counterUrl: "http://192.168.1.99/cm?cmnd=status%2010",
        storeFileName: "store.txt",
        goeChargerUrl: "http://192.168.1.222",
        lastset: "lastset.txt",
        activator: "acvitvator",
        minuteReportFile: "minutereport.csv"
    }
}

module.exports = {
    config
}