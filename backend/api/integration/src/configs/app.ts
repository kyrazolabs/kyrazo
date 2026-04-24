import * as dotenv from 'dotenv';
import { AckPolicy, DeliverPolicy } from 'nats';

// Load environment variables
dotenv.config({ path: './backend/api/.env' });

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'REDIS_URL', 'ENCRYPTION_KEY'];

console.log('Checking required env vars:');
requiredEnvVars.forEach(envVar => {
    console.log(`${envVar}: ${process.env[envVar] ? 'present' : 'MISSING'}`);
});

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

/**
 * @title App Configuration
 * @description Application-wide configuration object, including server, security, upload, and other settings. Loaded from environment variables.
 *
 * @example
 * import { config } from './app';
 * console.log(config.server.port);
 */
export const config = {
    // Application Configuration
    app: {
        name: process.env.APP_NAME || 'Kyrazo Integration',
        container: process.env.COOLIFY_CONTAINER_NAME || '1.0.0',
        ingest: {
            v1: 'https://api.kyrazo.com/ingest/v1/',
        },
    },

    // Server Configuration
    server: {
        port: parseInt(process.env.PORT || '3003'),
        env: process.env.NODE_ENV || 'development',
        host: process.env.HOST || '0.0.0.0',
    },

    // Redis Configuration
    redis: {
        url: process.env.REDIS_URL,
        host: process.env.REDIS_HOST!,
        port: parseInt(process.env.REDIS_PORT!),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        tls: process.env.NODE_ENV === 'production',
        caFile: '/etc/ssl/redis/ca.crt',
        certFile: '/etc/ssl/redis/client.crt',
        keyFile: '/etc/ssl/redis/client.key',
        queue: {
            url: process.env.QUEUE_REDIS_URL!,
            host: process.env.QUEUE_REDIS_HOST || process.env.REDIS_HOST!,
            port: parseInt(process.env.QUEUE_REDIS_PORT || process.env.REDIS_PORT!),
            password: process.env.QUEUE_REDIS_PASSWORD || process.env.REDIS_PASSWORD || '',
            db: parseInt(process.env.QUEUE_REDIS_DB || '1'),
            caFile: '/etc/ssl/redis/ca.crt',
            certFile: '/etc/ssl/redis/client.crt',
            keyFile: '/etc/ssl/redis/client.key',
        },
    },

    // NATS Configuration
    nats: {
        servers: process.env.NATS_SERVERS?.split(',') || ['nats://localhost:4222'],
        tls: {
            certFile: process.env.NATS_CERT_FILE || '/data/nats/certs/nats.pem',
            keyFile: process.env.NATS_KEY_FILE || '/data/nats/certs/nats.key',
            caFile: process.env.NATS_CA_FILE || '/data/nats/certs/ca.pem',
        },
        user: process.env.NATS_USER || 'admin',
        password: process.env.NATS_PASSWORD || 'adminPass',
        maxReconnectAttempts: parseInt(process.env.NATS_MAX_RECONNECT_ATTEMPTS || '10'),
        reconnectTimeWait: parseInt(process.env.NATS_RECONNECT_TIME_WAIT || '2000'),
        timeout: parseInt(process.env.NATS_TIMEOUT || '20000'),
    },

    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE,
        errorFile: process.env.ERROR_LOG_FILE,
        meta: {
            service: process.env.APP_NAME,
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

/**
 * @title Validate App Configuration
 * @description Validates the application configuration and throws an error if any required config is missing or invalid.
 * @returns {void}
 * @throws {Error} If configuration is invalid.
 * @example
 * validateConfig();
 */
export function validateConfig(): void {
    const errors: string[] = [];

    // Validate server port
    if (isNaN(config.server.port) || config.server.port < 1 || config.server.port > 65535) {
        errors.push('Invalid server port');
    }

    // Validate Redis port
    if (isNaN(config.redis.port) || config.redis.port < 1 || config.redis.port > 65535) {
        errors.push('Invalid Redis port');
    }

    if (errors.length > 0) {
        throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }
}

export default config;
