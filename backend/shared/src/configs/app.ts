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
        dbName: process.env.MONGODB_DB_NAME! || process.env.DB_NAME!,
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
        minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2'),
        serverSelectionTimeoutMS: parseInt(
            process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '10000'
        ),
        socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS || '45000'),
        connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT_MS || '10000'),
        heartbeatFrequencyMS: parseInt(process.env.MONGODB_HEARTBEAT_FREQUENCY_MS || '10000'),
        retryWrites: process.env.MONGODB_RETRY_WRITES !== 'false',
        retryReads: process.env.MONGODB_RETRY_READS !== 'false',
        // Explicitly controlled via MONGODB_SSL — do NOT tie to NODE_ENV.
        // MongoDB requireTLS will actively close non-TLS connections regardless of environment.
        ssl: process.env.MONGODB_SSL === 'true' || process.env.NODE_ENV === 'production',
        caFile: '/etc/ssl/mongodb/ca.crt',
        tlsCertificateKeyFile: '/etc/ssl/mongodb/mongodb.pem',
    },

    clickhouse: {
        url: process.env.CLICKHOUSE_URL || 'http://127.0.0.1:8123',
        username: process.env.CLICKHOUSE_USERNAME || 'default',
        password: process.env.CLICKHOUSE_PASSWORD || '',
        database: process.env.CLICKHOUSE_DATABASE || 'default',
        ssl: process.env.CLICKHOUSE_URL?.startsWith('https') || false,
        caFile: '/etc/ssl/clickhouse/ca.crt',
        rejectUnauthorized: true,
    },

    // Postgres Configuration
    postgres: {
        url: process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
        max: parseInt(process.env.POSTGRES_MAX_POOL || '20'),
        idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || '30000'),
        connectionTimeoutMillis: parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT || '2000'),
        ssl: process.env.POSTGRES_SSL === 'true' || process.env.NODE_ENV === 'production',
        sslMode: process.env.POSTGRES_SSL_MODE || 'require',
        caFile: process.env.POSTGRES_CA_FILE || '/etc/ssl/postgres/ca.crt',
    },

    // Redis Configuration
    redis: {
        url: process.env.REDIS_URL,
        host: process.env.REDIS_HOST!,
        port: parseInt(process.env.REDIS_PORT!),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        tls: process.env.REDIS_TLS === 'true' || process.env.NODE_ENV === 'production',
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

    security: {
        encryptions: {
            key: process.env.ENCRYPTION_KEY,
        },
    },

    // Logging Configuration
    logging: {
        meta: {
            service: process.env.APP_NAME,
            container: process.env.COOLIFY_CONTAINER_NAME,
            env: process.env.NODE_ENV,
            pid: process.pid,
        },
    },

    // Development Configuration
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
};

export default config;
