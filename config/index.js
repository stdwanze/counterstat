const fs = require('fs');
const path = require('path');

// Load .env file
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

/**
 * Centralized configuration management
 * All configuration from environment variables with sensible defaults
 */
const config = {
  // Sungrow Inverter WebSocket
  sungrow: {
    host: process.env.SUNGROW_HOST || '192.168.1.85',
    protocol: 'wss',
    port: 443,
    username: process.env.SUNGROW_USERNAME || 'user',
    password: process.env.SUNGROW_PASSWORD || 'pw1111',
    timeout: 5000,
    wsPath: '/ws/home/overview'
  },

  // DTU/HMS Gateway
  dtu: {
    host: process.env.DTU_HOST || '192.168.1.106',
    protocol: 'http',
    port: 80,
    timeout: 5000
  },

  // Grid Counter (Tasmota)
  gridCounter: {
    host: process.env.GRID_COUNTER_HOST || '192.168.1.223',
    protocol: 'http',
    port: 80,
    endpoint: '/cm?cmnd=status%2010',
    timeout: 5000
  },

  // GoE Charger
  goeCharger: {
    host: process.env.GOECHARGER_HOST || '192.168.1.146',
    protocol: 'http',
    port: 80,
    token: process.env.GOECHARGER_TOKEN || 'MC6Nfnc260V6XSQ2EJl9BnUYoQu10hTC',
    timeout: 5000
  },

  // InfluxDB Configuration
  influx: {
    host: process.env.INFLUX_HOST || '192.168.1.89',
    port: parseInt(process.env.INFLUX_PORT, 10) || 8086,
    database: process.env.INFLUX_DATABASE || 'powerdata',
    username: process.env.INFLUX_USERNAME || 'loggerPwr',
    password: process.env.INFLUX_PASSWORD || 'change_me',
    timeout: 5000
  },

  // External Services
  services: {
    performance: process.env.PERFORMANCE_SERVICE_URL || 'http://192.168.1.160:5000',
    car: process.env.CAR_SERVICE_URL || 'http://192.168.1.160:3000/lastvalparsed',
    medianPower: process.env.MEDIAN_POWER_SERVICE_URL || 'http://192.168.1.164:3001'
  },

  // File Storage
  storage: {
    storeFile: process.env.STORE_FILE || 'store.txt',
    lastSetFile: process.env.LASTSET_FILE || 'lastset.txt',
    activatorFile: process.env.ACTIVATOR_FILE || 'activator',
    cooldownFile: process.env.COOLDOWN_FILE || 'cooldown',
    minuteReportFile: process.env.MINUTE_REPORT_FILE || 'minutereport.csv',
    hoyemilesStoreFile: process.env.HOYEMILES_STORE_FILE || 'hoyemiles.txt'
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  },

  // Server
  server: {
    port: parseInt(process.env.HTTP_PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'production'
  },

  // Charge Control Policies
  chargeControl: {
    allowedStartHour: 6,
    allowedEndHour: 18,
    minChargeLevel: 1400,
    baseOffsetWatts: 2300,
    phase3Threshold: 2600,
    cooldownPeriods: 10,
    refreshInterval: 30, // minutes
    chartInterval: 12    // minutes
  }
};

/**
 * Build URLs for convenience
 */
config.sungrow.url = `${config.sungrow.protocol}://${config.sungrow.host}:${config.sungrow.port}${config.sungrow.wsPath}`;
config.dtu.url = `${config.dtu.protocol}://${config.dtu.host}:${config.dtu.port}`;
config.gridCounter.url = `${config.gridCounter.protocol}://${config.gridCounter.host}:${config.gridCounter.port}${config.gridCounter.endpoint}`;
config.goeCharger.url = `${config.goeCharger.protocol}://${config.goeCharger.host}:${config.goeCharger.port}`;
config.services.performance = config.services.performance || 'http://192.168.1.160:5000/currDayPerformance';

/**
 * Validate required configuration
 */
function validate() {
  const required = [
    ['influx.password', config.influx.password],
    ['goeCharger.token', config.goeCharger.token]
  ];

  const missing = required.filter(([key, value]) => 
    !value || value === 'change_me'
  );

  if (missing.length > 0) {
    console.warn('[Config] ⚠️  Missing or default values for:', missing.map(m => m[0]).join(', '));
    console.warn('[Config] Please set these in .env file');
  }
}

validate();

module.exports = config;
