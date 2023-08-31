function config(){

    return {
        counterUrl: "http://192.168.1.99/cm?cmnd=status%2010",
        storeFileName: "store.txt"
    }
}

module.exports = {
    config
}