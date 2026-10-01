import winston from 'winston';
import path from 'path';
import { config } from '@/config';

/**
 * @title Logger
 * @description Provides a singleton logger instance and utility functions for logging messages at various levels (info, warn, error, debug) throughout the application.
 *
 * @example
 * import { logger } from './logger';
 * logger.info('Server started');
 */

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = (): string => {
  return config.logging.level;
};

// Define different log formats
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define transports
const transports = [];

// Console transport
transports.push(
  new winston.transports.Console({
    format: config.isProduction ? productionFormat : developmentFormat,
  })
);

// File transport for production
if (config.isProduction || config.logging.file) {
  const logDir = path.dirname(config.logging.file || 'logs/app.log');

  // Ensure log directory exists
  const fs = require('fs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  transports.push(
    new winston.transports.File({
      filename: config.logging.file || 'logs/app.log',
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Separate error log file
  transports.push(
    new winston.transports.File({
      filename: config.logging.errorFile || 'logs/error.log',
      level: 'error',
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create the logger
export const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logging
export const loggerStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper functions for structured logging
export const logError = (message: string, error?: Error, metadata?: any) => {
  logger.error(message, {
    error: error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : undefined,
    metadata,
  });
};

export const logInfo = (message: string, metadata?: any) => {
  logger.info(message, { metadata });
};

export const logWarn = (message: string, metadata?: any) => {
  logger.warn(message, { metadata });
};

export const logDebug = (message: string, metadata?: any) => {
  logger.debug(message, { metadata });
};

// Activity logging helper
export const logActivity = (
  userId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: any,
  workspaceId?: string,
  teamId?: string,
  projectId?: string
) => {
  logger.info('Activity logged', {
    activity: {
      userId,
      action,
      targetType,
      targetId,
      details,
      workspaceId,
      teamId,
      projectId,
      timestamp: new Date().toISOString(),
    },
  });
};

export default logger;

