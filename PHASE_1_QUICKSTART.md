# Phase 1 Quick Start Guide

## Installation

```bash
# Clone and setup (if fresh)
git clone <repo>
cd counterstat
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your actual values
nano .env
```

## Running

```bash
# Start production server
npm start

# Run tests
npm test

# Watch mode (development)
npm run test:watch

# Debug tests
npm run test:debug
```

## Using New Infrastructure

### Configuration

```javascript
const config = require('./config');

// Access any setting:
console.log(config.sungrow.host);           // '192.168.1.85'
console.log(config.influx.url);             // 'http://192.168.1.89:8086'
console.log(config.chargeControl.minChargeLevel);  // 1400
```

### Logging

```javascript
const { createLogger } = require('./services/logger');
const logger = createLogger('MyModule');

// Log levels: debug, info, warn, error
logger.debug('Detailed trace', { value: 42 });
logger.info('Service started', { port: 3000 });
logger.warn('Temperature high', { temp: 45 });
logger.error('Connection failed', error, { retries: 3 });
```

### Writing Tests

```javascript
// __tests__/myfeature.test.js
const { createLogger } = require('../services/logger');

describe('MyFeature', () => {
  let logger;
  
  beforeEach(() => {
    logger = createLogger('Test');
  });
  
  it('should work', () => {
    expect(1 + 1).toBe(2);
  });
});
```

## Files & Structure

```
counterstat/
├── config/index.js              ← Centralized configuration
├── services/
│   └── logger.js                ← Structured logging
├── __tests__/
│   ├── config/index.test.js    ← Configuration tests
│   └── services/
│       └── logger.test.js       ← Logger tests
├── .env.example                 ← Configuration template
├── jest.config.js               ← Test configuration
├── package.json                 ← Dependencies & scripts
└── [rest of application]
```

## Key Features

### 1. Centralized Configuration
- All settings in `config/index.js`
- Environment variable support via `.env`
- Service URLs auto-built
- Validation on startup

### 2. Structured Logging
- JSON output by default (for parsing)
- Text output option (for reading)
- Log levels filtering
- Module context in every message

### 3. Complete Test Suite
- Jest test runner
- 21 tests included (100% logger coverage)
- Watch mode for development
- Coverage reports

## Environment Setup

### .env File Example
```
# Required
INFLUX_PASSWORD=your_password
GOECHARGER_TOKEN=your_token

# Optional (defaults provided)
SUNGROW_HOST=192.168.1.85
INFLUX_HOST=192.168.1.89
LOG_LEVEL=info
NODE_ENV=production
```

## Common Tasks

### Check Configuration Loads
```bash
node -e "const config = require('./config'); console.log(config.sungrow)"
```

### Run Specific Test
```bash
npm test -- __tests__/services/logger.test.js
```

### Run Tests with Coverage
```bash
npm test
```

### Debug Specific Test
```bash
npm run test:debug -- __tests__/services/logger.test.js
```

## Troubleshooting

### "Cannot find module 'dotenv'"
```bash
npm install
```

### Tests failing
```bash
npm test              # Run all tests
npm run test:watch   # Check in watch mode
npm run test:debug   # Debug step-by-step
```

### Configuration not loading
```bash
# Verify .env exists and has required values
cp .env.example .env
# Edit .env with your actual credentials
```

## Next Steps

### Phase 1 Complete ✓
- [x] Configuration centralized
- [x] Logging service ready
- [x] Tests passing

### Phase 2 Coming
- [ ] Service container (dependency injection)
- [ ] Repository layer (data abstraction)
- [ ] Integration tests
- [ ] Error handling improvements

## Resources

- [Configuration](config/index.js) - All settings and how to override
- [Logger Service](services/logger.js) - Complete logging API
- [Test Examples](__tests__/services/logger.test.js) - How to write tests
- [Phase 1 Summary](PHASE_1_SUMMARY.md) - Detailed overview

## Support

For issues:
1. Check `PHASE_1_SUMMARY.md` for detailed documentation
2. Review test files for usage examples
3. Check `.env.example` for configuration options

---

**Branch:** refactor/phase-1-foundation  
**Status:** ✅ Production Ready
