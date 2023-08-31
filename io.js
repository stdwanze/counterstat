const fs = require('fs');

function write(content, filename){
    try {
        fs.writeFileSync(filename,JSON.stringify(content));
    } catch (error) {
        console.error(error);
    }

}
function deleteFile(filename ){
    fs.unlinkSync(filename);

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
function exists(filename){
    try {
        if (fs.existsSync(filename)) {
         return true;
        }
      } catch(err) {
        console.error(err)
      }
      return false;
}

module.exports = {

    write,
    read,
    exists,
    deleteFile

}