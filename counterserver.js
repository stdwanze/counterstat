const polka = require('polka');
const { join } = require('path');
const fs = require('fs');
var axios = require('axios');
const { json } = require('body-parser');
const { getPower } = require('./sungrow');
const dtu = require('./hoyemiles');

var store = require('./store');
var io = require('./io');
var { getCurrPerf } = require("./currPerformance");
var config = require('./config').config();
const dir = join(__dirname, 'public');
const serve = require('serve-static')(dir);
dtu.init(config.dtuurl);

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
    .use(json())
    .use(safe(serve))  // Verwende den sicheren Wrapper
    .get('/stats', (req, res) => {
        store.init(config.storeFileName);
        res.end(JSON.stringify(store.getRecords()));
    })
    .get("/currDayPerformance", async (req, res) => {
        store.init(config.storeFileName);
        let counter = await axios({
            method: 'get',
            url: config.counterUrl,
        });
        let sun = await getPower();
        let h = null;
        try { h = await dtu.getPowerDTU(); } catch (e) { h = { YieldDay: { v: -1 } } }
        let perf = getCurrPerf(store, sun, h, counter);
        res.end(JSON.stringify(perf));

    })
    .get('/activate/:limit', (req, res) => {
        io.write({ offset: req.params.limit }, config.activator);
        res.end("activated");
    })
    .get('/deactivate', (req, res) => {
        io.deleteFile(config.activator);


        res.end("deactivated");
    })
    .get('/minutereport', (req, res) => {
        var content = io.readPlain(config.minuteReportFile);
        res.end(content);
    })
    .get('/chargecontrol', (req, res) => {
        var content = io.readPlain(config.lastset);
        res.end(content);
    })
    .get('/currSolar', async (req, res) => {
        let r = await getPower();
        let h = {}; h.Power = {}; h.Power.v = -1;
        try { h = await dtu.getPowerDTU(); } catch (e) { }
        let strings = {
            StringNorth: r.MPPT2,
            StringSouth: r.MPPT1,
            StringGarage: h.Power.v,
            Total: r.MPPT1 + r.MPPT2 + h.Power.v
        }

        res.end(JSON.stringify(strings));
    })
    .get("/error", (req, res) => {
        throw new Error("Dies ist ein absichtlich erzeugter Fehler für Testzwecke.");
    })
    .get('/portal', (req, res) => {
        // Achtung: niemals ungeprüfte Pfade direkt verwenden! Nur erlaubte Namen zulassen.
        
        try{
        const name = "portal";


        const filePath = join(__dirname, 'public', `${name}.html`);

        // Optional: Content-Length durch fs.stat ermitteln
        fs.stat(filePath, (err, stats) => {
            if (err || !stats.isFile()) {
                return res.status(404).send('Datei nicht gefunden');
            }

            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            // Cache-Control optional
            res.setHeader('Cache-Control', 'no-cache');

            // Streamen (speicherfreundlich)
            const stream = fs.createReadStream(filePath);
            stream.on('error', (err) => {
                console.error('Read error', err);
                if (!res.headersSent) res.end('<html></head><body>Server error</body></html>');
                else res.end();
            });
            stream.pipe(res);
        });
    }catch(err){
        console.error('Fehler beim Laden der Portal-Seite:', err);
        res.statusCode = 500;
        res.end('Serverfehler beim Laden der Portal-Seite');
    }})


    .listen(5000, err => {
        if (err) throw err;
        console.log(`> Running on localhost:5000`);
    });