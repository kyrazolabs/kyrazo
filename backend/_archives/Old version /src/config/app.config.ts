import { randomUUID } from "crypto";
import * as dotenv from "dotenv";
import { AckPolicy, DeliverPolicy } from "nats";

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["MONGODB_URI", "REDIS_HOST", "REDIS_PORT"];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    throw new Error(
        `Missing required environment variables: ${missingEnvVars.join(", ")}`
    );
}

const WORKER_ID = process.env.WORKER_ID || randomUUID();
/**
 * @title Worker Configuration
 * @description Worker-wide configuration object, including server, security, upload, and other settings. Loaded from environment variables.
 *
 * @example
 * import { config } from '@/config';
 * console.log(config.server.port);
 */
export const config = {
    // Worker Configuration
    worker: {
        name: `${process.env.WORKER_NAME!}-(${WORKER_ID})`,
        id: WORKER_ID,
        version: process.env.WORKER_VERSION!,
        concurrency: Number(process.env.WORKER_CONCURRENCY!), // BullMQ Queues
    },

    // Database Configuration
    database: {
        uri: process.env.MONGODB_URI!,
        dbName: process.env.DB_NAME!,
    },

    clickhouse: {
        url: process.env.CLICKHOUSE_URL || "http://127.0.0.1:8123",
        username: process.env.CLICKHOUSE_USERNAME || "nxion",
        password: process.env.CLICKHOUSE_PASSWORD || "password",
        database: process.env.CLICKHOUSE_DATABASE || "default",
    },

    // Redis Configuration
    redis: {
        url: process.env.REDIS_URL,
        host: process.env.REDIS_HOST!,
        port: parseInt(process.env.REDIS_PORT!),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || "0"),
        queue: {
            url: process.env.QUEUE_REDIS_URL || process.env.REDIS_URL!,
            host: process.env.QUEUE_REDIS_HOST || process.env.REDIS_HOST!,
            port: parseInt(
                process.env.QUEUE_REDIS_PORT || process.env.REDIS_PORT!
            ),
            password:
                process.env.QUEUE_REDIS_PASSWORD || process.env.REDIS_PASSWORD,
            db: parseInt(process.env.QUEUE_REDIS_DB || "1"),
        },
    },

    // Email Configuration
    email: {
        resend: {
            apiKey: process.env.RESEND_KEY!,
            rateLimit: {
                maxRequestsPerSecond: parseInt(
                    process.env.RESEND_RATE_LIMIT || "10"
                ),
                maxRequestsPerMinute: parseInt(
                    process.env.RESEND_RATE_LIMIT_MINUTE || "100"
                ),
            },
        },
        from: {
            email: process.env.FROM_EMAIL || "delivered@resend.dev",
            name: process.env.FROM_NAME || "Hookify",
        },
    },

    encryptions: {
        key: process.env.ENCRYPTION_KEY!,
    },

    // NATS Configuration
    nats: {
        servers: process.env.NATS_SERVERS?.split(",") || [
            "nats://localhost:4222",
        ],
        user: process.env.NATS_USER || "worker",
        password: process.env.NATS_PASSWORD || "workerPass",
        maxReconnectAttempts: parseInt(
            process.env.NATS_MAX_RECONNECT_ATTEMPTS || "10"
        ),
        reconnectTimeWait: parseInt(
            process.env.NATS_RECONNECT_TIME_WAIT || "2000"
        ),
        timeout: parseInt(process.env.NATS_TIMEOUT || "20000"),
        jetstream: {
            maxMemoryStore: process.env.NATS_JS_MAX_MEMORY_STORE || "2GB",
            maxFileStore: process.env.NATS_JS_MAX_FILE_STORE || "10GB",
            storeDir: process.env.NATS_JS_STORE_DIR || "./data/jetstream",
        },

        consumer: {
            stream: process.env.NATS_STREAM!,
            group: process.env.NATS_CONSUMER_GROUP!,
            ackPolicy: process.env.NATS_CONSUMER_ACK_POLICY! as AckPolicy,
            maxAckPending: parseInt(process.env.NATS_CONSUMER_MAX_ACK_PENDING!),
            maxDeliver: parseInt(process.env.NATS_CONSUMER_MAX_DELIVER!),
            deliverPolicy: process.env
                .NATS_CONSUMER_DELIVER_POLICY! as DeliverPolicy,
        },
    },

    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || "info",
        file: process.env.LOG_FILE,
        errorFile: process.env.ERROR_LOG_FILE,
    },

    // Activity Log Configuration
    activityLog: {
        retentionDays: parseInt(
            process.env.ACTIVITY_LOG_RETENTION_DAYS || "90"
        ),
        batchSize: parseInt(process.env.ACTIVITY_LOG_BATCH_SIZE || "100"),
    },

    // Development Configuration
    isDevelopment: process.env.NODE_ENV === "development",
    isProduction: process.env.NODE_ENV === "production",
    isTest: process.env.NODE_ENV === "test",
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
    if (
        isNaN(config.redis.port) ||
        config.redis.port < 1 ||
        config.redis.port > 65535
    ) {
        errors.push("Invalid Redis port");
    }

    if (errors.length > 0) {
        throw new Error(
            `Configuration validation failed: ${errors.join(", ")}`
        );
    }
}

export default config;
