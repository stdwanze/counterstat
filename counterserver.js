const polka = require('polka');
const { json } = require('body-parser');
var store = require('./store');
var config = require('./config').config();

polka()
    .use(json())
    .get('/stats', (req,res) =>{
        store.init(config.storeFileName);
        res.end(JSON.stringify(store.getRecords()));
    })
    
    .listen(3000, err => {
        if (err) throw err;
        console.log(`> Running on localhost:3000`);
      });