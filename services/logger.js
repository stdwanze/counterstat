/**
 * Structured Logging Service
 * Provides consistent logging with levels, timestamps, and structured output
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

class Logger {
  /**
   * @param {string} module - Module name for context
   * @param {string} level - Minimum log level (debug|info|warn|error)
   * @param {string} format - Output format (json|text)
   */
  constructor(module, level = 'info', format = 'json') {
    this.module = module;
    this.level = level;
    this.format = format;
    
    if (!LOG_LEVELS.hasOwnProperty(level)) {
      throw new Error(`Invalid log level: ${level}. Must be one of: ${Object.keys(LOG_LEVELS).join(', ')}`);
    }
  }

  /**
   * Internal method to output log
   */
  _output(level, message, data = {}) {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.level]) {
      return; // Skip if below minimum level
    }

    const timestamp = new Date().toISOString();
    
    if (this.format === 'json') {
      const logEntry = {
        timestamp,
        level,
        module: this.module,
        message,
        ...data
      };
      console.log(JSON.stringify(logEntry));
    } else {
      // Text format
      const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.module}]`;
      const dataStr = Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : '';
      console.log(`${prefix} ${message}${dataStr}`);
    }
  }

  /**
   * Debug level - detailed information
   */
  debug(message, data) {
    this._output('debug', message, data);
  }

  /**
   * Info level - general informational messages
   */
  info(message, data) {
    this._output('info', message, data);
  }

  /**
   * Warn level - warning messages (recoverable issues)
   */
  warn(message, data) {
    this._output('warn', message, data);
  }

  /**
   * Error level - error messages
   * @param {string} message - Error message
   * @param {Error} error - Error object
   * @param {object} data - Additional context
   */
  error(message, error, data = {}) {
    const errorData = {
      ...data,
      error: error?.message || error,
      stack: error?.stack || undefined
    };
    
    // Remove undefined values
    Object.keys(errorData).forEach(key => 
      errorData[key] === undefined && delete errorData[key]
    );
    
    this._output('error', message, errorData);
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext = {}) {
    const ChildLogger = class extends Logger {
      _output(level, message, data = {}) {
        return super._output(level, message, { ...additionalContext, ...data });
      }
    };
    
    return new ChildLogger(this.module, this.level, this.format);
  }

  /**
   * Set log level
   */
  setLevel(level) {
    if (!LOG_LEVELS.hasOwnProperty(level)) {
      throw new Error(`Invalid log level: ${level}`);
    }
    this.level = level;
  }
}

/**
 * Create a logger instance
 */
function createLogger(moduleName, options = {}) {
  const level = options.level || process.env.LOG_LEVEL || 'info';
  const format = options.format || process.env.LOG_FORMAT || 'json';
  return new Logger(moduleName, level, format);
}

module.exports = {
  Logger,
  createLogger,
  LOG_LEVELS
};
