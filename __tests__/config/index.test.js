/**
 * Configuration Tests
 */

describe('Configuration', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv };
    // Clear require cache
    delete require.cache[require.resolve('../../config/index.js')];
  });

  afterEach(() => {
    process.env = originalEnv;
    delete require.cache[require.resolve('../../config/index.js')];
  });

  it('should load default configuration', () => {
    const config = require('../../config/index.js');
    
    expect(config.sungrow).toBeDefined();
    expect(config.sungrow.host).toBe('192.168.1.85');
    expect(config.influx.host).toBe('192.168.1.89');
    expect(config.goeCharger.host).toBe('192.168.1.146');
  });

  it('should build correct URLs', () => {
    const config = require('../../config/index.js');
    
    expect(config.sungrow.url).toContain('wss://');
    expect(config.sungrow.url).toContain('192.168.1.85');
    expect(config.dtu.url).toContain('http://');
    expect(config.goeCharger.url).toContain('http://');
  });

  it('should have charge control policies', () => {
    const config = require('../../config/index.js');
    
    expect(config.chargeControl.allowedStartHour).toBe(6);
    expect(config.chargeControl.allowedEndHour).toBe(18);
    expect(config.chargeControl.minChargeLevel).toBe(1400);
    expect(config.chargeControl.cooldownPeriods).toBe(10);
  });

  it('should have all storage paths defined', () => {
    const config = require('../../config/index.js');
    
    expect(config.storage.storeFile).toBeDefined();
    expect(config.storage.lastSetFile).toBeDefined();
    expect(config.storage.activatorFile).toBeDefined();
    expect(config.storage.cooldownFile).toBeDefined();
  });

  it('should have logging configuration', () => {
    const config = require('../../config/index.js');
    
    expect(config.logging.level).toBeDefined();
    expect(config.logging.format).toBeDefined();
  });

  it('should have server configuration', () => {
    const config = require('../../config/index.js');
    
    expect(config.server.port).toBe(3000);
    // During tests, NODE_ENV may be 'test', so just verify it's defined
    expect(config.server.nodeEnv).toBeDefined();
  });
});
