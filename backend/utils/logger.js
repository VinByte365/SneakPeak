// utils/logger.js
const winston = require('winston');

/**
 * Winston Logger Configuration
 * Logs errors, info, and warnings to both file and console
 */
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // File output (optional)
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// If no winston, use simple console logger
if (!logger.error) {
  const util = require('util');
  logger.error = (...args) => console.error(util.format(...args));
  logger.info = (...args) => console.info(util.format(...args));
  logger.warn = (...args) => console.warn(util.format(...args));
}

module.exports = logger;
