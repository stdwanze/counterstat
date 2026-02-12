const polka = require('polka');
const { join } = require('path');
const fs = require('fs');
const dir = join(__dirname, 'public');
const serve = require('serve-static')(dir);
var io = require('./io');
var config = require('./config').config();

function handleError(err, req, res) {
    console.error('Static file error:', err);
    res.statusCode = 500;
    res.end('Static file error');
}
// Wrapper, der Fehler aus Middleware-Callbacks abfängt
function safe(mw) {
    return (req, res, next) => {
        try {
            mw(req, res, (err) => {
                if (err) handleError(err, req, res);
                else next();
            });
        } catch (err) {
            handleError(err, req, res);
        }
    };
}

polka()
    
    .use(safe(serve))  // Verwende den sicheren Wrapper
   
     .get('/activate/:limit', (req, res) => {
            io.write({ offset: req.params.limit }, config.activator);
            res.end("activated");
        })
        .get('/deactivate', (req, res) => {
            io.deleteFile(config.activator);
    
    
            res.end("deactivated");
        })
    .listen(3000, err => {
        if (err) {
        
            console.error('Fehler beim Starten des Servers:', err);
            process.exit(1); // Beende den Prozess mit Fehlercode

        }
        console.log(`> Running on localhost:3000`);
    });