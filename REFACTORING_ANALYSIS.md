# Counterstat Refactoring Analysis

## Executive Summary
Counterstat has grown organically as a real-time energy monitoring system. The codebase exhibits signs of typical organic growth: scattered configuration, duplicated patterns, weak separation of concerns, and silent error handling. This analysis identifies key refactoring opportunities that will improve maintainability, testability, and scalability.

---

## 🔴 Critical Issues

### 1. **Configuration Management - Hardcoded Values Everywhere**
**Severity:** HIGH | **Impact:** Maintainability, Security

**Problem:**
- IPs and credentials are scattered across multiple files:
  - `sungrow.js`: Hardcoded WebSocket URL (192.168.1.85) and credentials
  - `goecharger.js`: Hardcoded API token in query string
  - `counterserver.js`: DTU URL, counter URL mixed in imports
  - `influxapi.js`: InfluxDB credentials in code
  - `portalwriter.js`: Multiple service URLs

**Current State:**
```javascript
// sungrow.js
new WebSocket("wss://192.168.1.85/ws/home/overview", {...});
// influxapi.js
new Influx.InfluxDB({host: '192.168.1.89', password: powerPw, ...});
// goecharger.js 
url: 'api/status?filter=amp,psm,car,tpa,frc,wh&token=MC6Nfnc260V6XSQ2EJl9BnUYoQu10hTC'
```

**Recommended Refactoring:**
```javascript
// config.js - centralized
module.exports = {
  sungrow: {
    host: process.env.SUNGROW_HOST || '192.168.1.85',
    protocol: 'wss',
    credentials: { username: 'user', password: 'pw1111' }
  },
  influx: {
    host: process.env.INFLUX_HOST || '192.168.1.89',
    port: 8086,
    database: 'powerdata',
    auth: { username: 'loggerPwr', password: process.env.INFLUX_PW }
  },
  goecharger: {
    host: process.env.GOECHARGER_HOST || '192.168.1.146',
    token: process.env.GOECHARGER_TOKEN
  }
  // ... all other config
}
```

---

### 2. **Silent Error Handling & Missing Error Propagation**
**Severity:** HIGH | **Impact:** Debugging, System Reliability

**Problem:**
- Errors are caught but silently logged, making it hard to understand failures
- `io.js` returns empty objects `{}` on error instead of explicit error states
- No error recovery strategies or fallback values
- Axios calls in `counterserver.js` and `chargecontroller.js` lack error handlers

**Current Pattern:**
```javascript
// io.js - returns {} on ALL errors
function read(filename){
    try {
        var content = readPlain(filename);
        var jsobj = JSON.parse(content);
        return jsobj;
    } catch (error) {
        console.error(error);  // ← only logs, no context
        return {}  // ← indistinguishable from success
    }
}

// counterserver.js - no error handling
.get("/currDayPerformance", async (req, res) => {
    let counter = await axios({method: 'get', url: config.counterUrl}); // ← can throw
    let sun = await getPower();  // ← no error handling
    let h = null;
    try { h = await dtu.getPowerDTU(); } catch (e) { h = { YieldDay: { v: -1 } } }
    // ← inconsistent error handling
```

**Recommended Refactoring:**
```javascript
// io.js - better error handling
function read(filename) {
    try {
        const content = readPlain(filename);
        return { success: true, data: JSON.parse(content) };
    } catch (error) {
        console.error(`[IO] Failed reading ${filename}:`, error.message);
        return { success: false, error: error.message, data: null };
    }
}

// counterserver.js - consistent error handling
.get("/currDayPerformance", async (req, res) => {
    try {
        const counter = await axios.get(config.counterUrl);
        const sun = await getPower();
        const heatpump = await dtu.getPowerDTU().catch(() => ({ YieldDay: { v: -1 } }));
        const perf = getCurrPerf(store, sun, heatpump, counter);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(perf));
    } catch (error) {
        console.error('[API] currDayPerformance failed:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to fetch performance' }));
    }
})
```

---

### 3. **Lack of Data Access Abstraction - Direct File I/O Everywhere**
**Severity:** MEDIUM | **Impact:** Maintainability, Testing

**Problem:**
- Every module directly calls `io.read()`, `io.write()` with magic filenames
- No central data model or repository pattern
- Hard to test because everything touches the filesystem
- State management (`store.js`) and file I/O are tightly coupled

**Current Pattern:**
```javascript
// chargecontroller.js
let cd = store.read(config.cooldown);  // depends on filename config
cd.periodsLeft -= 1;
store.write(cd, config.cooldown);

// Doesn't protect invariants, no validation
// No central place to understand state structure
```

**Recommended Refactoring:**
```javascript
// Create a repository layer - persistence/repository.js
class CooldownRepository {
    constructor(ioService, filename) {
        this.io = ioService;
        this.filename = filename;
    }
    
    async get() {
        const result = await this.io.read(this.filename);
        if (!result.success) throw new Error(result.error);
        return { periodsLeft: result.data.periodsLeft || 0 };
    }
    
    async save(data) {
        if (data.periodsLeft < 0) throw new Error('periodsLeft cannot be negative');
        return this.io.write({ periodsLeft: data.periodsLeft }, this.filename);
    }
    
    async decrementCooldown() {
        const current = await this.get();
        if (current.periodsLeft > 0) current.periodsLeft--;
        await this.save(current);
        return current.periodsLeft;
    }
}

// Usage in chargecontroller.js
const cooldownRepo = new CooldownRepository(io, config.cooldown);
const remaining = await cooldownRepo.decrementCooldown();
```

---

### 4. **WebSocket Semaphore Anti-pattern**
**Severity:** MEDIUM | **Impact:** Concurrency, Debugging

**Problem:**
- `sungrow.js` uses a boolean semaphore to prevent concurrent requests
- Returns cached `lastres` from previous call if semaphore is busy
- Can return stale data without caller knowing
- No timeout handling for stuck WebSocket connections

**Current Code:**
```javascript
let semaphore = false;
let lastres = null;
async function getPower(){
    try {
        if(semaphore) return lastres;  // ← returns stale data silently
        semaphore = true;
        let res = await getPowerinternal();
        lastres = res;
        semaphore = false;
        return res;
    }
}
```

**Issues:**
- If WebSocket hangs, semaphore stays true forever
- Caller doesn't know if data is fresh or stale
- Not a true mutex/lock

**Recommended Refactoring:**
```javascript
class PowerQuery {
    constructor(wsUrl, timeout = 5000) {
        this.wsUrl = wsUrl;
        this.timeout = timeout;
        this.requestQueue = [];
        this.isProcessing = false;
    }
    
    async getPower() {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ resolve, reject });
            this.processQueue();
        });
    }
    
    async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) return;
        
        this.isProcessing = true;
        const requests = [...this.requestQueue];
        this.requestQueue = [];
        
        try {
            const result = await this._fetchWithTimeout();
            requests.forEach(r => r.resolve({ 
                data: result, 
                timestamp: Date.now(),
                fresh: true 
            }));
        } catch (error) {
            requests.forEach(r => r.reject(error));
        } finally {
            this.isProcessing = false;
            this.processQueue();
        }
    }
    
    async _fetchWithTimeout() {
        return Promise.race([
            this._internalFetch(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('WebSocket timeout')), this.timeout)
            )
        ]);
    }
}
```

---

## 🟡 Major Issues

### 5. **Module Initialization Scattered & Implicit Dependencies**
**Severity:** MEDIUM | **Impact:** Maintainability, Debugging

**Problem:**
- Modules require manual `.init()` calls before use
- No consistent initialization pattern
- Hard to understand dependency graph
- No startup validation or health checks

**Current Pattern:**
```javascript
// Must call .init() on every module separately
dtu.init(config.dtuurl);
car.setup(config.car);
charger.init(config.goeChargerUrl);
sungrow.init(...);  // does sungrow have init()?

// portalwriter.js does this again
dtu.init(config.dtuurl);
car.setup(config.car);
```

**Recommended Refactoring:**
```javascript
// Create a service locator / dependency container - services/container.js
class ServiceContainer {
    constructor(config) {
        this.config = config;
        this.services = {};
    }
    
    initialize() {
        this.services.sungrow = new SungrowService(this.config.sungrow);
        this.services.dtu = new DTUService(this.config.dtu);
        this.services.charger = new GoEChargerService(this.config.goecharger);
        this.services.influx = new InfluxService(this.config.influx);
        this.services.fileStore = new FileStore(this.config.storage);
        
        // Validate all services can connect
        return this.healthCheck();
    }
    
    async healthCheck() {
        const checks = await Promise.allSettled([
            this.services.sungrow.ping(),
            this.services.dtu.ping(),
            this.services.charger.ping(),
            this.services.influx.ping()
        ]);
        
        const failures = checks
            .map((check, idx) => [check, Object.keys(this.services)[idx]])
            .filter(([check]) => check.status === 'rejected');
        
        if (failures.length > 0) {
            console.warn('Health check failures:', failures);
        }
        
        return failures.length === 0;
    }
    
    get(serviceName) {
        if (!this.services[serviceName]) {
            throw new Error(`Service not found: ${serviceName}`);
        }
        return this.services[serviceName];
    }
}

// Usage in all modules
const container = require('./services/container');
const sungrow = container.get('sungrow');
const dtu = container.get('dtu');
```

---

### 6. **Duplicate Data Retrieval & Aggregation Logic**
**Severity:** MEDIUM | **Impact:** Performance, Consistency

**Problem:**
- Multiple files fetch similar data from the same sources
- Data aggregation logic (`currPerformance.js`) is separate from portal logic
- Multiple API endpoints return overlapping data

**Current Pattern:**
```javascript
// counterserver.js - fetches performance data
let counter = await axios({method: 'get', url: config.counterUrl});
let sun = await getPower();
let h = await dtu.getPowerDTU();
let perf = getCurrPerf(store, sun, h, counter);  // ← custom aggregation

// portalwriter.js - fetches similar data
let performace = await axios({method: 'get', url: config.performance});
// then fetches AGAIN:
let outsideTemp = await getOutsideTemperature();
let heatpump = await getHeatpumpData();
```

**Recommended Refactoring:**
```javascript
// Create a unified data service - services/energyDataService.js
class EnergyDataService {
    constructor(container) {
        this.sungrow = container.get('sungrow');
        this.dtu = container.get('dtu');
        this.influx = container.get('influx');
        this.store = container.get('store');
        this.counter = container.get('counter');
        this.cache = { lastFetch: null, data: null, ttl: 30000 };
    }
    
    async getCurrentMetrics() {
        // Return cached data if fresh
        if (this.cache.lastFetch && Date.now() - this.cache.lastFetch < this.cache.ttl) {
            return this.cache.data;
        }
        
        // Fetch all in parallel
        const [sun, heatpump, grid, temp] = await Promise.all([
            this.sungrow.getPower(),
            this.dtu.getPowerDTU(),
            this.counter.getStatus(),
            this.influx.getOutsideTemperature()
        ]);
        
        const data = {
            solar: { sungrow: sun, garage: heatpump },
            grid: grid,
            temperature: temp,
            timestamp: Date.now(),
            performance: this._calculatePerformance(sun, grid)
        };
        
        this.cache = { lastFetch: Date.now(), data, ttl: 30000 };
        return data;
    }
    
    _calculatePerformance(solar, grid) {
        // Single source of truth for performance calculation
        return { /* ... */ };
    }
}

// Now both counterserver.js and portalwriter.js use the same service
const energyData = await energyDataService.getCurrentMetrics();
```

---

### 7. **Time-based Scheduling Logic is Ad-Hoc**
**Severity:** MEDIUM | **Impact:** Maintainability, Testing

**Problem:**
- Time-based triggers scattered in `chargecontroller.js` and `portalwriter.js`
- Hardcoded times: 6 AM–6 PM, minute==30, minute%12==0, etc.
- No central scheduler or cron-like system
- Difficult to test time-dependent logic

**Current Pattern:**
```javascript
// portalwriter.js
function isRefreshTime(){
    let m = new Date();
    let ret = false;
    m.getMinutes() == 30 ? ret= true: ret= false;
    return ret;
}
function isChartTime(){
    let m = new Date();
    let ret = false;
    m.getMinutes() % 12 == 0 ?  ret= true: ret= false;
    return ret;
}

// chargecontroller.js
function isNotAllowedToRun(){
    let currentTime = new Date();
    if(currentTime.getHours() < 6 || currentTime.getHours() > 18) return true;
    // ...
}
```

**Recommended Refactoring:**
```javascript
// Create a scheduler - services/scheduler.js
class Scheduler {
    constructor() {
        this.tasks = [];
        this.running = false;
    }
    
    addTask(name, trigger, handler) {
        this.tasks.push({ name, trigger, handler, lastRun: null });
    }
    
    start() {
        if (this.running) return;
        this.running = true;
        this._loop();
    }
    
    async _loop() {
        while (this.running) {
            const now = new Date();
            
            for (const task of this.tasks) {
                if (task.trigger.shouldRun(now, task.lastRun)) {
                    try {
                        await task.handler();
                        task.lastRun = now;
                        console.log(`[Scheduler] Task executed: ${task.name}`);
                    } catch (error) {
                        console.error(`[Scheduler] Task failed: ${task.name}`, error);
                    }
                }
            }
            
            // Check every second
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    stop() {
        this.running = false;
    }
}

// Trigger strategies
class EveryNMinutes {
    constructor(n) { this.n = n; }
    shouldRun(now, lastRun) {
        if (!lastRun) return now.getMinutes() % this.n === 0;
        return (now - lastRun) >= this.n * 60000;
    }
}

class AtMinute {
    constructor(minute) { this.minute = minute; }
    shouldRun(now) { return now.getMinutes() === this.minute; }
}

class WithinHours {
    constructor(start, end) { this.start = start; this.end = end; }
    shouldRun(now) { 
        const h = now.getHours();
        return h >= this.start && h < this.end;
    }
}

// Usage
const scheduler = new Scheduler();
scheduler.addTask('refresh-portal', new AtMinute(30), portalwriter.refresh);
scheduler.addTask('update-charts', new EveryNMinutes(12), portalwriter.updateCharts);
scheduler.addTask('charge-control', 
    new CombinedTrigger([new EveryNMinutes(1), new WithinHours(6, 18)]),
    chargeController.run
);
scheduler.start();
```

---

### 8. **Bloated Modules with Mixed Concerns**
**Severity:** MEDIUM | **Impact:** Maintainability, Testability

**Problem:**
- `chargecontroller.js` mixes state management, cooldown logic, charger commands, and axios calls
- `portalwriter.js` does data fetching, template rendering, and file I/O
- `goecharger.js` has scattered responsibility between state and commands

**Current Pattern:**
```javascript
// chargecontroller.js (122 lines doing too much)
// - File I/O for cooldown, activator, lastset
// - Charger command logic
// - Power calculation logic
// - Cooldown counter management
// - 3-phase switching logic

async function run(){
    let allowed = true;
    if(isNotAllowedToRun()) { allowed=false; }  // ← time logic
    cooldown();  // ← state management
    let counter = await axios({ method: 'get', url: counterurl, });  // ← http
    let result = null;
    let chargerData = await charger.getChargerConsumptionInWattsAndWh();  // ← device query
    // ... many more concerns
}
```

**Recommended Refactoring:**
```javascript
// Separate into focused classes
class CooldownManager {
    constructor(repository) { this.repo = repository; }
    async decrementAndCheck() { /* ... */ }
    async hasExpired() { /* ... */ }
}

class ChargeDecisionEngine {
    constructor(charger, powerSource) {
        this.charger = charger;
        this.powerSource = powerSource;
    }
    
    async calculateOptimalCharge(availablePower) {
        // Pure business logic, no side effects
        const { phases, amps } = this._optimizeForPower(availablePower);
        return { phases, amps };
    }
}

class ChargeControlOrchestrator {
    constructor(engine, charger, scheduler, policies) {
        this.engine = engine;
        this.charger = charger;
        this.policies = policies;
    }
    
    async run() {
        // Orchestration logic only
        if (!this.policies.isAllowedToRun(new Date())) return;
        
        const decision = await this.engine.calculateOptimalCharge(...);
        await this.charger.setPower(decision);
        await this.charger.logAction(decision);
    }
}
```

---

### 9. **No Logging Strategy - Only Console.log()**
**Severity:** MEDIUM | **Impact:** Operations, Debugging

**Problem:**
- No structured logging
- No log levels (debug, info, warn, error)
- No way to filter or route logs
- Console.log statements scattered everywhere
- No timestamps/context in logs

**Current Pattern:**
```javascript
console.log(res);  // what is res?
console.log("start: " + new Date());  // date but no context
console.error('WebSocket error:', err);  // inconsistent format
console.log("got Performance: " + new Date());  // duplicate timestamp logic
```

**Recommended Refactoring:**
```javascript
// Create a logging service - services/logger.js
class Logger {
    constructor(name, level = 'info') {
        this.name = name;
        this.level = level;
        this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
    }
    
    log(level, message, data = {}) {
        if (this.levels[level] >= this.levels[this.level]) {
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level,
                module: this.name,
                message,
                ...data
            }));
        }
    }
    
    debug(msg, data) { this.log('debug', msg, data); }
    info(msg, data) { this.log('info', msg, data); }
    warn(msg, data) { this.log('warn', msg, data); }
    error(msg, error, data = {}) { 
        this.log('error', msg, { 
            error: error.message, 
            stack: error.stack,
            ...data 
        }); 
    }
}

// Usage
const logger = new Logger('Sungrow');
logger.info('WebSocket connected', { url: this.wsUrl });
logger.error('Connection failed', err, { retryCount: 3 });
```

---

## 🟠 Code Quality Issues

### 10. **No Input Validation**
**Severity:** LOW | **Impact:** Robustness

**Problem:**
- No validation of API responses
- No type checking on function parameters
- No bounds checking on numbers

```javascript
// chargecontroller.js - accepts any value
function is3PhaseActivatable(chargerWattage){
    let cd = store.read(config.cooldown);
    if(cd.periodsLeft < 1) return true;
    if(chargerWattage > 4200) return true;  // ← what if chargerWattage is null/undefined/string?
    return false;
}
```

**Fix:** Add validation layer or use TypeScript/JSDoc

---

### 11. **Unused/Dead Code**
**Severity:** LOW | **Impact:** Maintainability

**Files to review:**
- `rand.js` - appears unused
- `statanalyser.js` - marked as "unused" in instructions
- `hoymilepowerstore.js` - unclear purpose
- `counterserver_static.js` - duplicate of counterserver.js?
- `runnightly.js` / `nightlyRunner.js` - both exist?

**Recommendation:** Audit and remove unused modules

---

### 12. **No Tests or Test Infrastructure**
**Severity:** MEDIUM | **Impact:** Reliability, Refactoring Safety

**Current State:**
- Only manual tests via HTTP endpoints
- No unit tests
- No integration tests
- Hard to safely refactor

**Recommended Setup:**
```javascript
// package.json
"scripts": {
    "test": "jest --coverage",
    "test:watch": "jest --watch"
},
"devDependencies": {
    "jest": "^29.0.0"
}

// __tests__/services/cooldownManager.test.js
describe('CooldownManager', () => {
    let manager;
    let mockRepo;
    
    beforeEach(() => {
        mockRepo = { get: jest.fn(), save: jest.fn() };
        manager = new CooldownManager(mockRepo);
    });
    
    test('should decrement cooldown', async () => {
        mockRepo.get.mockResolvedValue({ periodsLeft: 5 });
        await manager.decrementAndCheck();
        expect(mockRepo.save).toHaveBeenCalledWith({ periodsLeft: 4 });
    });
});
```

---

## 🟢 Implementation Roadmap

### Phase 1: Foundation (1-2 weeks)
1. **Extract Configuration** → Use environment variables + centralized config
2. **Add Logging Service** → Replace console.log with structured logger
3. **Create Tests** → Unit test critical paths (CooldownManager, PerformanceCalculation)

### Phase 2: Architecture (2-3 weeks)
4. **Build Service Container** → Dependency injection and initialization
5. **Create Repository Layer** → Wrap all file I/O
6. **Implement Data Service** → Unified metrics aggregation

### Phase 3: Refactor Modules (3-4 weeks)
7. **Replace Semaphore** → Use proper queue-based approach in Sungrow
8. **Split Responsibilities** → Chargecontroller → orchestrator + engine + manager
9. **Add Scheduler** → Replace ad-hoc time checks

### Phase 4: Polish (1-2 weeks)
10. **Remove Dead Code** → Clean up unused modules
11. **Add Error Handling** → Wrap API calls properly
12. **Document Architecture** → Update README with new structure

---

## Implementation Priority Matrix

| Issue | Priority | Effort | Impact | Recommended Order |
|-------|----------|--------|--------|-------------------|
| Configuration Management | 1 | Medium | High | Start here |
| Silent Error Handling | 2 | High | High | Early |
| Service Container | 3 | High | High | Before other refactors |
| Logging Strategy | 4 | Low | Medium | Quick win |
| Module Initialization | 5 | Medium | Medium | With service container |
| Scheduler | 6 | Medium | Medium | Mid-phase |
| Split Modules | 7 | High | Medium | Late-phase |
| Semaphore Pattern | 8 | Medium | Low | Nice to have |
| Remove Dead Code | 9 | Low | Low | Final cleanup |
| Add Tests | 10 | High | High | Ongoing, highest value |

---

## Quick Wins (< 2 hours each)

1. **Add `.env.example` file** → Document required environment variables
2. **Create `logger.js`** → Structured logging with timestamps
3. **Add `REFACTORING_CHECKLIST.md`** → Track progress
4. **Extract magic strings/numbers** → Move to config constants
5. **Add JSDoc comments** → Type hints for critical functions

---

## Summary

The Counterstat project needs refactoring along **three dimensions**:

1. **Configuration** (scattered → centralized)
2. **Error Handling** (silent → explicit)
3. **Architecture** (monolithic → layered with clear concerns)

**Start with Phase 1** (configuration + logging + tests), which will give you a foundation for safer refactoring. The service container pattern in Phase 2 unlocks the ability to do major restructuring without fear of breaking things.

All changes should maintain backward compatibility with the existing e-ink display and HTTP API contracts.
