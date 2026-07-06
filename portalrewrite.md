# Portal Rewrite Plan

## Target Device
Samsung Galaxy Tab A SM-T550 (9.7", 2015)
- Resolution: **1024 × 768 px** (XGA, 4:3)
- PPI: 132 (lower than eink 720p target which was 1280×720)
- Browser: Samsung Internet / Chrome (real browser engine, CSS fully supported)

Previous target: eink 1280×720 (wider, 16:9 landscape)
New target: 1024×768 (narrower, 4:3) → slightly less horizontal space, more height

---

## Architecture: Static Server + data.json

### Current flow
```
cron → portalwriter.js → fills portaltemplate.html with {placeholders} → public/portal.html → scp → webserver
tablet: meta http-equiv="refresh" content="40" (full page reload every 40s)
```

### New flow
```
cron → portalwriter.js → writes data.json → scp → webserver
tablet: portal.html (static scaffold) + fetch(data.json) every 30s → DOM update (no reload)
```

Portal.html is a one-time deploy (static). Only data.json changes on every cron run.
scp still uploads both: `portal.html` (rarely changes) and `data.json` (every run).

---

## data.json Structure

portalwriter.js assembles this object and writes `public/data.json`:

```json
{
  "DateTime": "06.07.2026, 14:30:00",
  "OutsideTemp": "22.1",
  "carState": "",
  "SoC": 80,
  "Range": 300,
  "PVSUM": "1234",
  "PVNorth": "500",
  "PVSouth": "600",
  "PVGarage": "134",
  "Charge": "800",
  "Next": "●● ---",
  "charged": "12.5",
  "overflow": "200",
  "energy": "5.2",
  "dtu": "1.1",
  "sum": "6.3",
  "autarchy": "75.0",
  "grid": "2.1",
  "consumption": "4.5",
  "ownuse": "3.2",
  "deliver": "1.1",
  "Heisswasser": "52",
  "Heizungpuffer": "45",
  "CompressorStatus": "ON",
  "CompressorValue": "75"
}
```

---

## Changes to portalwriter.js

Replace the final `html = html.replace(...)` block + `io.writePlain(html, "./public/portal.html")` call with a function that:
1. Assembles a plain data object (same values as before)
2. Writes `JSON.stringify(data, null, 2)` to `./public/data.json`
3. Keeps writing `./public/portal.html` pointing to the static scaffold (or skip if scaffold already deployed)

```js
function writeDataJson(data) {
    io.writePlain(JSON.stringify(data, null, 2), "./public/data.json");
}
```

The `minLengthReturn` padding logic (whitespace for alignment) is no longer needed — DOM rendering handles alignment. Remove it or keep only for backwards compat if HTML fallback wanted.

---

## New portal.html (Static Scaffold)

### Key differences from portaltemplate.html
- No `{placeholder}` strings — DOM elements have `id` attributes
- No `meta http-equiv="refresh"` — JS handles updates
- JS `fetch("./data.json")` every 30s, updates DOM
- Stale data indicator if fetch fails (show last-updated timestamp)

### HTML structure (replaces portaltemplate.html)

```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <table class="main-table">
        <tr>
            <td class="header-cell-left"><span id="DateTime">--</span></td>
            <td class="header-cell-center">Outside: <span id="OutsideTemp">--</span>°C</td>
            <td class="header-cell-right"><span id="carState"></span> Car: <span id="SoC">--</span>% | <span id="Range">--</span>km</td>
        </tr>
    </table>

    <table class="power-table">
        <tr>
            <td class="power-cell">
                <div class="power-label">PV</div>
                <div class="power-number" id="PVSUM">--</div>
                <div class="power-unit">W</div>
                <div class="power-subtext">N: <span id="PVNorth">--</span>W<br>S: <span id="PVSouth">--</span>W<br>G: <span id="PVGarage">--</span>W</div>
            </td>
            <td class="power-cell">
                <div class="power-label">goE</div>
                <div class="power-number" id="Charge">--</div>
                <div class="power-unit">W</div>
                <div class="power-subtext">Next: <span id="Next">--</span><br>Chg: <span id="charged">--</span>kWh</div>
            </td>
            <td class="power-cell">
                <div class="power-label">Grid</div>
                <div class="power-number" id="overflow">--</div>
                <div class="power-unit">W</div>
            </td>
        </tr>
    </table>

    <table class="metrics-table">
        <tbody>
        <tr>
            <td class="metric-cell">
                <div class="metric-label">Produced</div>
                <div class="metric-number" id="sum">--</div>
                <div class="metric-unit">kWh</div>
                <div class="metric-subtext">SG: <span id="energy">--</span> kWh<br>G: <span id="dtu">--</span> kWh</div>
            </td>
            <td class="metric-cell">
                <div class="metric-label">Autarchy</div>
                <div class="metric-number" id="autarchy">--</div>
                <div class="metric-unit">%</div>
                <div class="metric-subtext">Import: <span id="grid">--</span> kWh</div>
            </td>
            <td class="metric-cell">
                <div class="metric-label">Heatpump</div>
                <div class="metric-subtext">HW: <span id="Heisswasser">--</span>°C<br>HP: <span id="Heizungpuffer">--</span>°C<br><span id="CompressorStatus">--</span> <span id="CompressorValue">--</span>%</div>
            </td>
        </tr>
        <tr>
            <td class="metric-cell">
                <div class="metric-label">Consumed</div>
                <div class="metric-number" id="consumption">--</div>
                <div class="metric-unit">kWh</div>
            </td>
            <td class="metric-cell">
                <div class="metric-label">Own Use</div>
                <div class="metric-number" id="ownuse">--</div>
                <div class="metric-unit">kWh</div>
            </td>
            <td class="metric-cell">
                <div class="metric-label">Delivered</div>
                <div class="metric-number" id="deliver">--</div>
                <div class="metric-unit">kWh</div>
            </td>
        </tr>
        </tbody>
    </table>

    <script>
    const FIELDS = [
        "DateTime","OutsideTemp","carState","SoC","Range",
        "PVSUM","PVNorth","PVSouth","PVGarage",
        "Charge","Next","charged","overflow",
        "energy","dtu","sum","autarchy","grid",
        "consumption","ownuse","deliver",
        "Heisswasser","Heizungpuffer","CompressorStatus","CompressorValue"
    ];

    function applyData(data) {
        FIELDS.forEach(id => {
            const el = document.getElementById(id);
            if (el && data[id] !== undefined) el.textContent = data[id];
        });
    }

    async function fetchData() {
        try {
            const res = await fetch("./data.json?t=" + Date.now());
            if (!res.ok) throw new Error(res.status);
            const data = await res.json();
            applyData(data);
        } catch (e) {
            console.warn("fetch failed:", e);
        }
    }

    fetchData();
    setInterval(fetchData, 30000);
    </script>
</body>
```

Cache-busting via `?t=Date.now()` ensures stale server cache doesn't block updates.

---

## CSS Adjustments for 1024×768

Target: fill the screen in landscape without scroll. The 4:3 ratio gives more height relative to width vs the old 16:9 eink.

Changes to `styles.css`:
- `body font-size`: keep 12px base
- `.power-number font-size`: 40px → **44px** (more height available)
- `.metric-number font-size`: 30px → **34px**
- `.metric-label font-size`: 21px → **22px**
- `.power-subtext font-size`: 15px → **16px**
- `.metric-subtext font-size`: 18px → **18px** (unchanged)
- `.header-cell-center font-size`: 18px → **20px**
- `.power-table height`: 100px → **110px**
- Add `max-height: 768px; overflow: hidden` to body to prevent scroll on tablet

Add stale-data style (optional):
```css
body.stale { opacity: 0.7; }
```
Set `document.body.classList.add('stale')` on fetch error, remove on success.

---

## Implementation Steps

1. **portalwriter.js**: Add `writeDataJson(data)` call at end of `doIt()`, assembling data object from existing variables. Keep or drop `portal.html` write (recommend keep for fallback during transition).

2. **portal.html** (new scaffold): Create `public/portal.html` with ID-based DOM and fetch script above. This replaces `portaltemplate.html`'s role as the served file.

3. **styles.css**: Apply font/size tweaks for 1024×768.

4. **scp script**: Ensure both `portal.html` and `data.json` are in the upload set. `portal.html` can be uploaded only once or kept in the set (it's idempotent).

5. **Test**: Open `portal.html` locally from `public/` folder via a simple http server, verify fetch works and DOM updates.

---

## Not Changing
- `portaltemplate.html` remains as-is (legacy fallback, or can be removed after cutover)
- `runnightly.js`, `nightlyRunner.js`, cron setup — untouched
- `chargecontroller.js`, all data sources — untouched
- `refreshtemplate.html`, `charttemplate.html` — chart flow is separate, revisit later
- Overall cron + scp deployment flow — unchanged

---

*Sources: [Samsung Galaxy Tab A SM-T550 specs](https://www.devicespecifications.com/en/model/aa1b3389)*
