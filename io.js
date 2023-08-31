const fs = require('fs');

function write(content, filename){
    try {
        fs.writeFileSync(filename,JSON.stringify(content));
    } catch (error) {
        console.error(error);
    }

}

function read(filename){

    try {
        var content = fs.readFileSync(filename);
        var jsobj = JSON.parse(content);
        return jsobj;
    } catch (error) {
        console.error(error);
        return {}
    }
}

module.exports = {

    write,
    read

}