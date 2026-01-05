import winston from 'winston';
import type TransportStream from 'winston-transport';
import path from 'path';
import fs from 'fs';
import 'winston-daily-rotate-file';
import config from './app';

/**
 * @title Enhanced Logger
 * @description Production-grade log with daily rotation, structured JSON output,
 * metadata enrichment, and sensitive-data sanitization.
 */

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

const getLogLevel = () => {
    return config.isDevelopment
        ? 'debug' // verbose logging during development
        : 'info'; // quieter logs in production
};

// Helper to sanitize sensitive data
const sanitize = (obj: any) => {
    if (!obj || typeof obj !== 'object') return obj;
    const clone = { ...obj };
    ['password', 'token', 'secret', 'apikey', 'refreshToken'].forEach(k => {
        if (k in clone) delete clone[k];
    });
    return clone;
};

// === Formats ===
const devFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.printf(info => {
        const meta = info.metadata
            ? JSON.stringify(info.metadata, null, 2)
            : '';
        return `${info.timestamp} ${info.level}: ${info.message}${meta ? `\n${meta}` : ''}`;
    })
);

const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// === Transport setup ===
const logDir = path.resolve('logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

// Daily rotate for app logs
const rotateFile = (filename: string, level?: string) =>
    new (winston.transports as any).DailyRotateFile({
        dirname: logDir,
        filename: `${filename}-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        level,
        format: prodFormat,
    });

// === Transports ===
const transports: TransportStream[] = [
    new winston.transports.Console({
        level: getLogLevel(),
        format: config.isProduction ? prodFormat : devFormat,
    }),
];

if (config.isDevelopment) {
    transports.push(
        new winston.transports.File({
            filename: path.join(logDir, 'development.json'),
            level: 'error',
            format: prodFormat,
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5,
        })
    );
}


if (config.isProduction) {
    transports.push(
        rotateFile('app'),
        rotateFile('error', 'error'),
        rotateFile('activity', 'info'),
        rotateFile('http', 'http')
    );
}

// === Logger ===
export const log = winston.createLogger({
    level: getLogLevel(),
    levels,
    defaultMeta: {
        service: config.logging.meta.service,
        version: config.app.version,
        env: config.logging.meta.env,
        pid: config.logging.meta.pid,
    },
    transports,
    exitOnError: false,
});

// === Morgan stream integration ===
export const loggerStream = {
    write: (message: string) => log.http(message.trim()),
};

export const logger = {
    // === Structured helper functions ===
    error: (message: string, error?: Error, metadata?: any) => {
        log.error(message, {
            error: error
                ? {
                      name: error.name,
                      message: error.message,
                      stack: error.stack,
                  }
                : undefined,
            metadata: sanitize(metadata),
        });
    },

    warn: (message: string, metadata?: any) => {
        log.warn(message, { metadata: sanitize(metadata) });
    },

    info: (message: string, metadata?: any) => {
        log.info(message, { metadata: sanitize(metadata) });
    },

    debug: (message: string, metadata?: any) => {
        log.debug(message, { metadata: sanitize(metadata) });
    },

    // === Activity-specific logging ===
    activity: (
        userId: string,
        action: string,
        targetType: string,
        targetId: string,
        details?: any,
        workspaceId?: string,
        teamId?: string,
        projectId?: string
    ) => {
        log.info('User Activity', {
            activity: {
                userId,
                action,
                targetType,
                targetId,
                details: sanitize(details),
                workspaceId,
                teamId,
                projectId,
                timestamp: new Date().toISOString(),
            },
        });
    },
};

export default logger;
