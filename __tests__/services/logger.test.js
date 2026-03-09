/**
 * Logger Tests
 */

const { Logger, createLogger, LOG_LEVELS } = require('../../services/logger');

describe('Logger', () => {
  let logOutput = [];
  let originalLog;

  beforeEach(() => {
    logOutput = [];
    originalLog = console.log;
    console.log = jest.fn((msg) => logOutput.push(msg));
  });

  afterEach(() => {
    console.log = originalLog;
  });

  describe('createLogger', () => {
    it('should create a logger with default settings', () => {
      const logger = createLogger('TestModule');
      expect(logger.module).toBe('TestModule');
      expect(logger.level).toBe('info');
      expect(logger.format).toBe('json');
    });

    it('should create a logger with custom settings', () => {
      const logger = createLogger('TestModule', { level: 'debug', format: 'text' });
      expect(logger.level).toBe('debug');
      expect(logger.format).toBe('text');
    });
  });

  describe('logging levels', () => {
    let logger;

    beforeEach(() => {
      logger = new Logger('Test', 'debug', 'json');
    });

    it('should log debug messages', () => {
      logger.debug('Debug message', { key: 'value' });
      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.level).toBe('debug');
      expect(parsed.message).toBe('Debug message');
      expect(parsed.key).toBe('value');
    });

    it('should log info messages', () => {
      logger.info('Info message');
      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.level).toBe('info');
      expect(parsed.message).toBe('Info message');
    });

    it('should log warn messages', () => {
      logger.warn('Warning message');
      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.level).toBe('warn');
    });

    it('should log error messages with error details', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.level).toBe('error');
      expect(parsed.error).toBe('Test error');
      expect(parsed.stack).toContain('Error: Test error');
    });
  });

  describe('log level filtering', () => {
    it('should filter messages below minimum level', () => {
      const logger = new Logger('Test', 'warn', 'json');
      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(logOutput.length).toBe(2); // Only warn and error
      expect(JSON.parse(logOutput[0]).level).toBe('warn');
      expect(JSON.parse(logOutput[1]).level).toBe('error');
    });
  });

  describe('JSON format', () => {
    it('should output valid JSON with timestamps', () => {
      const logger = new Logger('Test', 'info', 'json');
      logger.info('Test message', { data: 'value' });

      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.module).toBe('Test');
      expect(parsed.level).toBe('info');
      expect(parsed.data).toBe('value');
    });
  });

  describe('text format', () => {
    it('should output readable text format', () => {
      const logger = new Logger('Test', 'info', 'text');
      logger.info('Test message');

      expect(logOutput[0]).toContain('[INFO]');
      expect(logOutput[0]).toContain('[Test]');
      expect(logOutput[0]).toContain('Test message');
    });
  });

  describe('child logger', () => {
    it('should inherit level and format from parent', () => {
      const parent = new Logger('Parent', 'warn', 'json');
      const child = parent.child({ requestId: '123' });

      child.warn('Child message');
      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.requestId).toBe('123');
      expect(parsed.module).toBe('Parent');
    });

    it('should merge context with additional data', () => {
      const logger = new Logger('Test', 'info', 'json');
      const child = logger.child({ userId: '42' });

      child.info('Message', { action: 'login' });
      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.userId).toBe('42');
      expect(parsed.action).toBe('login');
    });
  });

  describe('error handling', () => {
    it('should throw on invalid log level', () => {
      expect(() => {
        new Logger('Test', 'invalid');
      }).toThrow('Invalid log level: invalid');
    });

    it('should handle errors without stack', () => {
      const logger = new Logger('Test', 'error', 'json');
      logger.error('Error occurred', 'simple error string');
      const parsed = JSON.parse(logOutput[0]);
      expect(parsed.error).toBe('simple error string');
      expect(parsed.stack).toBeUndefined();
    });
  });

  describe('setLevel', () => {
    it('should dynamically change log level', () => {
      const logger = new Logger('Test', 'info', 'json');
      logger.debug('Debug 1'); // Should not log

      logger.setLevel('debug');
      logger.debug('Debug 2'); // Should log

      expect(logOutput.length).toBe(1);
      expect(JSON.parse(logOutput[0]).message).toBe('Debug 2');
    });

    it('should throw on invalid level', () => {
      const logger = new Logger('Test', 'info', 'json');
      expect(() => logger.setLevel('invalid')).toThrow();
    });
  });
});
