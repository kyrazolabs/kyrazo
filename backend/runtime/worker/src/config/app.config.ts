import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';
import { AckPolicy, DeliverPolicy } from 'nats';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'REDIS_URL', 'ENCRYPTION_KEY'];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

/**
 * @title Worker Configuration
 * @description Worker-wide configuration object, including server, security, upload, and other settings. Loaded from environment variables.
 *
 * @example
 * import { config } from '@/config';
 * console.log(config.server.port);
 */
export const config = {
    // Redis Configuration
    redis: {
        url: process.env.REDIS_URL!,
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        tls: process.env.NODE_ENV === 'production',
        caFile: process.env.REDIS_CA_FILE || '/etc/ssl/redis/ca.crt',
        certFile: process.env.REDIS_CERT_FILE || '/etc/ssl/redis/client.crt',
        keyFile: process.env.REDIS_KEY_FILE || '/etc/ssl/redis/client.key',
        queue: {
            url: process.env.QUEUE_REDIS_URL || process.env.REDIS_URL!,
            host: process.env.QUEUE_REDIS_HOST || process.env.REDIS_HOST!,
            port: parseInt(process.env.QUEUE_REDIS_PORT || process.env.REDIS_PORT!),
            password: process.env.QUEUE_REDIS_PASSWORD || process.env.REDIS_PASSWORD,
            db: parseInt(process.env.QUEUE_REDIS_DB || '1'),
            tls: process.env.NODE_ENV === 'production',
            caFile:
                process.env.QUEUE_REDIS_CA_FILE ||
                process.env.REDIS_CA_FILE ||
                '/etc/ssl/redis/ca.crt',
            certFile:
                process.env.QUEUE_REDIS_CERT_FILE ||
                process.env.REDIS_CERT_FILE ||
                '/etc/ssl/redis/client.crt',
            keyFile:
                process.env.QUEUE_REDIS_KEY_FILE ||
                process.env.REDIS_KEY_FILE ||
                '/etc/ssl/redis/client.key',
        },
        stream: {
            url: process.env.STREAM_REDIS_URL || process.env.REDIS_URL!,
            host: process.env.STREAM_REDIS_HOST || process.env.REDIS_HOST!,
            port: parseInt(process.env.STREAM_REDIS_PORT || process.env.REDIS_PORT!),
            password: process.env.STREAM_REDIS_PASSWORD || process.env.REDIS_PASSWORD,
            db: parseInt(process.env.STREAM_REDIS_DB || '2'),
            tls: process.env.NODE_ENV === 'production',
            caFile: process.env.STREAM_REDIS_CA_FILE || process.env.REDIS_CA_FILE || '/etc/ssl/redis/ca.crt',
            certFile: process.env.STREAM_REDIS_CERT_FILE || process.env.REDIS_CERT_FILE || '/etc/ssl/redis/client.crt',
            keyFile: process.env.STREAM_REDIS_KEY_FILE || process.env.REDIS_KEY_FILE || '/etc/ssl/redis/client.key',
        },
    },

    encryptions: {
        key: process.env.ENCRYPTION_KEY!,
    },

    // NATS Configuration
    nats: {
        servers: process.env.NATS_SERVERS?.split(',') || ['nats://localhost:4222'],
        tls: {
            enabled: process.env.NATS_TLS === 'true' || process.env.NODE_ENV === 'production',
            certFile: process.env.NATS_CERT_FILE || '/etc/ssl/nats/client.crt',
            keyFile: process.env.NATS_KEY_FILE || '/etc/ssl/nats/client.key',
            caFile: process.env.NATS_CA_FILE || '/etc/ssl/nats/ca.crt',
        },
        user: process.env.NATS_USER || 'worker',
        password: process.env.NATS_PASSWORD || 'workerPass',
        maxReconnectAttempts: parseInt(process.env.NATS_MAX_RECONNECT_ATTEMPTS || '10'),
        reconnectTimeWait: parseInt(process.env.NATS_RECONNECT_TIME_WAIT || '2000'),
        timeout: parseInt(process.env.NATS_TIMEOUT || '20000'),
    },

    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE,
        errorFile: process.env.ERROR_LOG_FILE,
    },

    // Development Configuration
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
};

/**
 * @title Validate Worker Configuration
 * @description Validates the application configuration and throws an error if any required config is missing or invalid.
 * @returns {void}
 * @throws {Error} If configuration is invalid.
 * @example
 * validateConfig();
 */
export function validateConfig(): void {
    const errors: string[] = [];

    // Validate Redis port
    if (isNaN(config.redis.port) || config.redis.port < 1 || config.redis.port > 65535) {
        errors.push('Invalid Redis port');
    }

    if (errors.length > 0) {
        throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }
}

export default config;
