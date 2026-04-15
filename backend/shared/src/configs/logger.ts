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
        const { timestamp, level, message, error, metadata, ...rest } = info;
        const meta = metadata ? JSON.stringify(metadata, null, 4) : '';
        const errorDetails = error
            ? (error as any).stack || (error as any).message || JSON.stringify(error, null, 4)
            : '';

        // Include any other properties from rest if they exist
        const extra = Object.keys(rest).length > 0 ? JSON.stringify(rest, null, 4) : '';

        return `${timestamp} ${level}: ${message}${errorDetails ? `\n${errorDetails}` : ''}${meta ? `\nMeta: ${meta}` : ''}${extra ? `\nExtra: ${extra}` : ''}`;
    })
);

const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// === Transport setup ===
const logDir = path.resolve('logs');
let isLogDirWritable = false;

if (process.env.DISABLE_FILE_LOGGING === 'true') {
    console.warn('Logging: File logging is explicitly disabled via DISABLE_FILE_LOGGING env var.');
} else {
    try {
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        // Test if writable
        const testFile = path.join(logDir, '.write-test');
        fs.writeFileSync(testFile, '');
        fs.unlinkSync(testFile);
        isLogDirWritable = true;
    } catch (err: any) {
        console.error(
            `Logging: Failed to initialize log directory at ${logDir}. Falling back to Console-only logging. Error:`,
            err.message
        );
    }
}

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

if (isLogDirWritable) {
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
} else if (config.isProduction) {
    console.warn(
        'Logging: Skipping file transports because log directory is not writable or file logging is disabled.'
    );
}

// === Logger ===
export const log = winston.createLogger({
    level: getLogLevel(),
    levels,
    defaultMeta: {
        service: config.logging.meta.service,
        container: config.logging.meta.container,
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
    error: (message: string, error?: any, metadata?: any) => {
        log.error(message, {
            error,
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
        namespaceId?: string
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
                namespaceId,
                timestamp: new Date().toISOString(),
            },
        });
    },
};

export default logger;
