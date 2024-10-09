const fs = require('fs');

function write(content, filename){
    try {
        fs.writeFileSync(filename,JSON.stringify(content));
    } catch (error) {
        console.error(error);
    }

}
function writePlain(content, filename){
    try {
        fs.writeFileSync(filename,content);
    } catch (error) {
        console.error(error);
    }

}
function deleteFile(filename ){
    try {
        fs.unlinkSync(filename);
    } catch (error) {
        console.error(error);
    }
  

}
function read(filename){

    try {
        var content = readPlain(filename);
        var jsobj = JSON.parse(content);
        return jsobj;
    } catch (error) {
        console.error(error);
        return {}
    }
}
function readPlain(filename){

    try {
        var content = fs.readFileSync(filename);
     
        return content;
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

function appendPlain(content, filename){

    try {
        if (fs.appendFileSync(filename,content)) {
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
    readPlain,
    exists,
    deleteFile,
    appendPlain,
    writePlain

}