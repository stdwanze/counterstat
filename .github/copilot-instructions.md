# Counterstat AI Coding Agent Instructions

## Project Overview
Counterstat is a real-time energy monitoring and solar charging control system that aggregates data from multiple home energy sources (Sungrow inverter, DTU/HMS gateway, grid counter, EV charger) and makes intelligent charging decisions based on available solar power.

## Architecture

### Core Data Flow
1. **Data Collection Layer** → **Store/State Layer** → **Processing Layer** → **Portal/API Layer**
   - Multiple hardware APIs collect power/counter data asynchronously
   - [store.js](store.js) maintains persistent state (JSON files) tracking daily consumption/delivery totals
   - [io.js](io.js) handles all file I/O with error catching
   - [influxapi.js](influxapi.js) writes metrics to InfluxDB (192.168.1.89:8086)

### Key External Systems (Hard-coded IPs in [config.js](config.js))
- **Sungrow Inverter** (192.168.1.85): WebSocket-based power queries via [sungrow.js](sungrow.js)
- **DTU/HMS Gateway** (192.168.1.106): HTTP API for garage solar power via [hoyemiles.js](hoyemiles.js)
- **Grid Counter** (192.168.1.223): Tasmota device returning E320 power/energy via HTTP
- **GoECharger** (192.168.1.146): EV charger control via [goecharger.js](goecharger.js) (API token hardcoded)
- **Performance Aggregator** (192.168.1.160:5000): External service providing composite metrics
- **30s Median Power** (192.168.1.164:3001): External service for smoothed power readings

### Server Architecture
- **[counterserver.js](counterserver.js)** (main HTTP server via Polka):
  - `/stats` - returns store records (daily consumption/delivery history)
  - `/currDayPerformance` - aggregates all data sources for current performance dashboard
  - `/currSolar` - returns instantaneous solar strings power (North/South/Garage)
  - `/activate/:limit` and `/deactivate` - controls EV charging via offset parameter
  - `/minutereport` and `/chargecontrol` - file-based status reads

## Component Responsibilities

### Real-time Monitoring
- [portalwriter.js](portalwriter.js): Periodic task (~6 min intervals) refreshing portal HTML with latest metrics. Calls:
  - `config.performance` to get aggregated sungrow + dtu + consumption data
  - InfluxDB writes via `writePV()`, `writePVEnergy()`, `writeGridEnergy()`
  - Template rendering: [refreshtemplate.html](refreshtemplate.html) at 30-min intervals, [charttemplate.html](charttemplate.html) every 6 min

### Charging Logic
- [chargecontroller.js](chargecontroller.js): Smart EV charging orchestration:
  - Only runs 6 AM–6 PM (`isNotAllowedToRun()`)
  - Reads activation offset from [activator](activator) file (created by `/activate/:limit` endpoint)
  - Implements 10-period cooldown to prevent 3-phase switching thrashing
  - Calculates optimal amps/phases based on available overflow power
  - Calls `goecharger.setPower()` with power thresholds: 1400W min, 2300W base offset, phase up at 2600W+

### Data Persistence
- All state stored as JSON files in workspace root:
  - [store.txt](store.txt): Daily totals (totalconsumed, totaldelivered, dailyrecord array)
  - [lastset.txt](lastset.txt): Last charger command/status
  - [cooldown](cooldown): Charger cooldown counter
  - [activator](activator): Current charging offset limit
  - [minutereport.csv](minutereport.csv): Time-series consumption records

### Performance Calculation
- [currPerformance.js](currPerformance.js): Calculates autarchy (self-consumption %) by:
  1. Summing produced energy: sungrow + dtu
  2. Calculating grid import (cIn) and export (cOut) deltas from store baseline
  3. Autarchy = own consumption / total consumption × 100

## Coding Patterns & Conventions

### Asynchronous Handling
- Use **semaphore flags** (e.g., `sungrow.js` with `semaphore` boolean) to prevent concurrent requests to same endpoint
- WebSocket queries block until `message` event; always wrap in timeout-aware promise or return cached `lastres`
- All axios calls are unawait-friendly: wrap in try-catch at call site, return defaults on failure

### File Operations
- Always call `store.init(filename)` before `store.read/write/getRecords()`
- Wrap file operations in [io.js](io.js) functions; never use `fs` directly
- Errors in [io.js](io.js) return empty objects `{}`, not thrown—check for undefined properties
- Example: `if(current.totalconsumed == undefined)` in [store.js](store.js) line 6

### Config & Initialization
- All URLs/IPs in [config.js](config.js); separate modules call `.init()` before use (sungrow, dtu, charger, car)
- Timestamps use native `new Date()` (German system)
- No environment variables; production-ready hardcoded values

### Web Framework (Polka)
- Routes are synchronous unless explicitly async
- Use `safe()` wrapper middleware to catch errors and prevent crashes (line 24 of [counterserver.js](counterserver.js))
- Body parser enabled for JSON; use `res.end(JSON.stringify(obj))`

## Common Workflows

### Adding a New Data Source
1. Create module with `init(baseurl)` and async query function
2. Add config entry to [config.js](config.js)
3. Call in [portalwriter.js](portalwriter.js) `doIt()` or [chargecontroller.js](chargecontroller.js) `run()`
4. Write results to InfluxDB if metric-relevant

### Adjusting Charging Logic
- Modify wattage thresholds in [goecharger.js](goecharger.js) `setPower()` (lines 58–77)
- Modify time window in [chargecontroller.js](chargecontroller.js) `isNotAllowedToRun()` (line 16)
- Test by setting [activator](activator) manually and calling `/chargecontrol` endpoint

### Debugging Power Data
- Check [lastset.txt](lastset.txt) for charger state and last command
- Query `/currDayPerformance` endpoint to trace aggregated performance calculation
- Check InfluxDB for historical GridEnergy/pvEnergy metrics (database: `powerdata`)

## File Structure Reference
```
counterserver.js      # HTTP API & stats endpoint
chargecontroller.js   # Smart EV charging logic (run periodically)
portalwriter.js       # Portal refresh & metric publishing
sungrow.js            # WebSocket power queries
hoyemiles.js          # DTU/HMS HTTP API
goecharger.js         # Charger control API
store.js              # Persistent JSON state manager
io.js                 # File I/O utilities
config.js             # Centralized config (IPs, file names)
influxapi.js          # InfluxDB metric writer
currPerformance.js    # Autarchy calculation
statanalyser.js       # Monthly aggregation (unused)
public/               # Static HTML portal
```

## Notes for AI Agents
- **No test framework**: Manual testing via HTTP endpoints only
- **No TypeScript**: Pure Node.js ES5 (some arrow functions)
- **Error handling**: Generally silent failures; check console logs and return values
- **Concurrency**: Semaphores used, but no formal locking; avoid nested async calls to same endpoint
- **Performance**: Single-threaded; heavy operations (WebSocket connects) can block
