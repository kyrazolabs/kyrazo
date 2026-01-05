import * as dotenv from 'dotenv';
import { AckPolicy, DeliverPolicy } from 'nats';

// Load environment variables
dotenv.config({ path: './backend/api/.env' });

// Validate required environment variables
const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'REDIS_HOST',
    'REDIS_PORT',
    'ENCRYPT_KEY',
    'ENCRYPTION_KEY',
];

console.log('Checking required env vars:');
requiredEnvVars.forEach(envVar => {
    console.log(`${envVar}: ${process.env[envVar] ? 'present' : 'MISSING'}`);
});

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    throw new Error(
        `Missing required environment variables: ${missingEnvVars.join(', ')}`
    );
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
    // Server Configuration
    server: {
        port: parseInt(process.env.PORT || '3003'),
        env: process.env.NODE_ENV || 'development',
        host: process.env.HOST || '0.0.0.0',
    },

    // Database Configuration
    database: {
        uri: process.env.MONGODB_URI!,
        dbName: process.env.DB_NAME!,
        encKey: process.env.ENCRYPTION_KEY!,
    },

    clickhouse: {
        url: process.env.CLICKHOUSE_URL || 'http://127.0.0.1:8123',
        username: process.env.CLICKHOUSE_USERNAME || 'default',
        password: process.env.CLICKHOUSE_PASSWORD || '',
        database: process.env.CLICKHOUSE_DATABASE || 'default',
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

    // NATS Configuration
    nats: {
        servers: process.env.NATS_SERVERS?.split(',') || [
            'nats://localhost:4222',
        ],
        user: process.env.NATS_USER || 'admin',
        password: process.env.NATS_PASSWORD || 'adminPass',
        maxReconnectAttempts: parseInt(
            process.env.NATS_MAX_RECONNECT_ATTEMPTS || '10'
        ),
        reconnectTimeWait: parseInt(
            process.env.NATS_RECONNECT_TIME_WAIT || '2000'
        ),
        timeout: parseInt(process.env.NATS_TIMEOUT || '20000'),
        jetstream: {
            maxMemoryStore: process.env.NATS_JS_MAX_MEMORY_STORE || '2GB',
            maxFileStore: process.env.NATS_JS_MAX_FILE_STORE || '10GB',
            storeDir: process.env.NATS_JS_STORE_DIR || './data/jetstream',
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

    // JWT Configuration
    jwt: {
        secrets: {
            access: process.env.JWT_ACCESS_SECRET!,
            refresh: process.env.JWT_REFRESH_SECRET!,
            key: process.env.JWT_SECRET!,
        },
        expires: {
            access: process.env.JWT_ACCESS_EXPIRES_IN || '15h',
            refresh: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
            reset: process.env.RESET_TOKEN_EXPIRY || '1h',
            verification: process.env.VERIFICATION_TOKEN_EXPIRY || '24h',
        },
    },

    arcjet: {
        ARCJET_ENV: process.env.ARCJET_ENV || 'development',
        ARCJET_KEY: process.env.ARCJET_KEY || '',
    },

    // Security Configuration
    security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
        sessionSecret: process.env.SESSION_SECRET || process.env.JWT_SECRET!,
        corsOrigin: /*process.env.CORS_ORIGIN?.split(',') ||*/ [
            'http://localhost:3000',
            'http://localhost:8080/',
            'http://localhost:4200',
            'http://192.168.8.28:8080',
            'http://127.0.0.1:8080',
        ],
        corsCredentials: process.env.CORS_CREDENTIALS === 'true',

        encryptions: {
            key: process.env.ENCRYPT_KEY,
        },

        rateLimiter: {
            auth: {
                login: {
                    points: 5, // 5req/min
                    duration: 60, // every minute
                    blockDuration: 0,

                    bots: {
                        points: 10,
                        duration: 60 * 60, // every hour to block bots
                        blockDuration: 0,
                        keyPrefix: (ip: string) => `ratelimit:login:ip:${ip}`,
                    },
                },
                register: {
                    points: 3, // 3req/min
                    duration: 60, //  every minute
                    blockDuration: 0,
                    keyPrefix: (ip: string) => `rate:register:ip:${ip}`,

                    bots: {
                        points: 10, // 10req/h
                        duration: 60 * 60, // every hour to block bots
                        blockDuration: 0,
                        keyPrefix: (ip: string) => `rate:register:ip:${ip}`,
                    },
                },
                token: {
                    refresh: {
                        points: 5, // req/20min
                        duration: 60 * 20, // every 20 min
                        blockDuration: 0,
                        keyPrefix: (ip: string) => `ratelimit:refresh:ip:${ip}`,
                    },
                },
                password: {
                    forgot: {
                        points: 3, // 3req/h per email
                        duration: 60 * 60, // every hour
                        blockDuration: 0,
                        keyPrefix: (email: string) =>
                            `ratelimit:password:forgot:${email}`,
                    },
                    reset: {
                        points: 10, // 10req/h
                        duration: 60 * 60, // every hour
                        blockDuration: 0,
                        keyPrefix: (ip: string) =>
                            `ratelimit:password:reset:${ip}`,
                    },
                    change: {
                        points: 10, // 10req/h
                        duration: 60 * 60, // every hour
                        blockDuration: 0,
                        keyPrefix: (userId: string) =>
                            `ratelimit:password:reset:${userId}`,
                    },
                },
                email: {
                    verify: {
                        points: 3, // 3req/h per email
                        duration: 60 * 60, // every hour
                        blockDuration: 0,
                        keyPrefix: (email: string) =>
                            `ratelimit:email:verify:${email}`,
                    },
                },
                multiFa: {
                    points: 5, // 5req/10min
                    duration: 60 * 10, // every 10 min
                    blockDuration: 0,
                    keyPrefix: (userId: string) =>
                        `ratelimit:2fa:user:${userId}`,
                },
            },
            sdk: {
                points: 30, // 30req/s
                duration: 1, // لكل ثانية
                blockDuration: 0,
            },
            protected: {
                normal: {
                    points: 60, // 60 requests per minute
                    duration: 60,
                    blockDuration: 0,
                    keyPrefix: (userId: string) =>
                        `ratelimit:protected:normal:${userId}`,
                },
                medium: {
                    points: 40, // 40 requests per minute
                    duration: 60,
                    blockDuration: 60, // 1 minute block
                    keyPrefix: (userId: string) =>
                        `ratelimit:protected:medium:${userId}`,
                },
                sensitive: {
                    points: 20, // 20 requests per minute
                    duration: 60,
                    blockDuration: 300, // 5 minutes block
                    keyPrefix: (userId: string) =>
                        `ratelimit:protected:sensitive:${userId}`,
                },
            },
        },
    },

    // 2FA Configuration
    twoFA: {
        serviceName: process.env.TWO_FA_SERVICE_NAME || 'B2B Todo App',
        issuer: process.env.TWO_FA_ISSUER || 'B2B Todo',
        window: 2, // Allow 2 time steps before and after current time
    },

    // Email Configuration
    email: {
        resend: {
            apiKey: process.env.RESEND_KEY!,
            rateLimit: {
                maxRequestsPerSecond: parseInt(
                    process.env.RESEND_RATE_LIMIT || '10'
                ),
                maxRequestsPerMinute: parseInt(
                    process.env.RESEND_RATE_LIMIT_MINUTE || '100'
                ),
            },
        },
        from: {
            email: process.env.FROM_EMAIL || 'delivered@resend.dev',
            name: process.env.FROM_NAME || 'Hookify',
        },
    },

    // Telegram Configuration
    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        sourceUrl: process.env.TELEGRAM_WEBHOOK_URL,
    },

    // Google Chat Configuration
    googleChat: {
        sourceUrl: process.env.GOOGLE_CHAT_WEBHOOK_URL,
    },

    // Security Configuration
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        skipSuccessfulRequests:
            process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS === 'true',
        message: 'Too many requests from this IP, please try again later.',
    },

    // File Upload Configuration
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
        uploadPath: process.env.UPLOAD_PATH || 'uploads/',
        allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
    },
    payment: {
        paypal: {
            key: process.env.PAYPAL_API_KEY!,
            secret: process.env.PAYPAL_SECRET!,
            username: process.env.PAYPAL_USERNAME!,
            password: process.env.PAYPAL_PASSWORD!,
        },
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

    // Application Configuration
    app: {
        name: process.env.APP_NAME || 'B2B Todo App',
        version: process.env.APP_VERSION || '1.0.0',
        url: process.env.APP_URL || 'http://localhost:3003',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
    },
    contacts: {
        support: process.env.SUPPORT_EMAIL || 'support@yourdomain.com',
        abuse: process.env.ABUSE_EMAIL || 'abuse@yourdomain.com',
        partnerships:
            process.env.PARTNERSHIPS_EMAIL || 'partners@yourdomain.com',
    },

    // Background Jobs Configuration
    queue: {
        defaultJobOptions: {
            removeOnComplete: 10,
            removeOnFail: 5,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
        },
        notification: {
            batchSize: parseInt(process.env.NOTIFICATION_BATCH_SIZE || '50'),
            retryAttempts: parseInt(
                process.env.NOTIFICATION_RETRY_ATTEMPTS || '3'
            ),
            retryDelay: parseInt(
                process.env.NOTIFICATION_RETRY_DELAY || '5000'
            ),
        },
    },

    // Activity Log Configuration
    activityLog: {
        retentionDays: parseInt(
            process.env.ACTIVITY_LOG_RETENTION_DAYS || '90'
        ),
        batchSize: parseInt(process.env.ACTIVITY_LOG_BATCH_SIZE || '100'),
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
    if (
        isNaN(config.server.port) ||
        config.server.port < 1 ||
        config.server.port > 65535
    ) {
        errors.push('Invalid server port');
    }

    // Validate Redis port
    if (
        isNaN(config.redis.port) ||
        config.redis.port < 1 ||
        config.redis.port > 65535
    ) {
        errors.push('Invalid Redis port');
    }

    // Validate bcrypt rounds
    if (
        isNaN(config.security.bcryptRounds) ||
        config.security.bcryptRounds < 4 ||
        config.security.bcryptRounds > 20
    ) {
        errors.push('Invalid bcrypt rounds (should be between 4 and 20)');
    }

    if (errors.length > 0) {
        throw new Error(
            `Configuration validation failed: ${errors.join(', ')}`
        );
    }
}

export default config;
