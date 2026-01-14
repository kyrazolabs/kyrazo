import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * @title App Configuration
 * @description Application-wide configuration object, including server, security, upload, and other settings. Loaded from environment variables.
 *
 * @example
 * import { config } from './app';
 * console.log(config.server.port);
 */
export const config = {
    // Database Configuration
    database: {
        uri: process.env.MONGODB_URI!,
        dbName: process.env.DB_NAME!,
    },

    clickhouse: {
        url: process.env.CLICKHOUSE_URL || 'http://127.0.0.1:8123',
        username: process.env.CLICKHOUSE_USERNAME || 'default',
        password: process.env.CLICKHOUSE_PASSWORD || '',
        database: process.env.CLICKHOUSE_DATABASE || 'default',
    },

    // Postgres Configuration
    postgres: {
        url:
            process.env.POSTGRES_URL ||
            'postgresql://postgres:postgres@localhost:5432/postgres',
        max: parseInt(process.env.POSTGRES_MAX_POOL || '20'),
        idleTimeoutMillis: parseInt(
            process.env.POSTGRES_IDLE_TIMEOUT || '30000'
        ),
        connectionTimeoutMillis: parseInt(
            process.env.POSTGRES_CONNECTION_TIMEOUT || '2000'
        ),
    },

    // Redis Configuration
    redis: {
        url: process.env.REDIS_URL,
        host: process.env.REDIS_HOST!,
        port: parseInt(process.env.REDIS_PORT!),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        queue: {
            url: process.env.QUEUE_REDIS_URL!,
            host: process.env.QUEUE_REDIS_HOST || process.env.REDIS_HOST!,
            port: parseInt(
                process.env.QUEUE_REDIS_PORT || process.env.REDIS_PORT!
            ),
            password:
                process.env.QUEUE_REDIS_PASSWORD ||
                process.env.REDIS_PASSWORD ||
                '',
            db: parseInt(process.env.QUEUE_REDIS_DB || '1'),
        },
    },

    security: {
        encryptions: {
            key: process.env.ENCRYPTION_KEY,
        },
    },

    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE,
        errorFile: process.env.ERROR_LOG_FILE,
        meta: {
            service: process.env.APP_NAME,
            version: process.env.APP_VERSION || '1.0.0',
            env: process.env.NODE_ENV,
            pid: process.pid,
        },
        error: {
            exitOnError: false,
        },
    },

    // Development Configuration
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
};

export default config;
