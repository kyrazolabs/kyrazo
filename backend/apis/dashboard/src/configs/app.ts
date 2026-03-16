import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'ENCRYPTION_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_MAIN_PRODUCT_ID',
    'BILLING_BASE_URL',
    'BILLING_ADMIN_EMAIL',
    'SENTRY_DSN',
];

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
    // Server Configuration
    server: {
        port: parseInt(process.env.PORT || '3003'),
        env: process.env.NODE_ENV || 'development',
        host: process.env.HOST || '0.0.0.0',
    },

    // Application Configuration
    app: {
        name: process.env.APP_NAME || 'Kyrazo',
        url: process.env.APP_URL || 'http://localhost:3003',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
        ingest: {
            v1: 'https://api.kyrazo.com/ingest/v1/',
        },
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
            url: process.env.QUEUE_REDIS_URL,
            host: process.env.QUEUE_REDIS_HOST || process.env.REDIS_HOST!,
            port: parseInt(process.env.QUEUE_REDIS_PORT || process.env.REDIS_PORT!),
            password: process.env.QUEUE_REDIS_PASSWORD || process.env.REDIS_PASSWORD || '',
            db: parseInt(process.env.QUEUE_REDIS_DB || '1'),
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

    // Security Configuration
    security: {
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
                        keyPrefix: (email: string) => `ratelimit:password:forgot:${email}`,
                    },
                    reset: {
                        points: 10, // 10req/h
                        duration: 60 * 60, // every hour
                        blockDuration: 0,
                        keyPrefix: (ip: string) => `ratelimit:password:reset:${ip}`,
                    },
                    change: {
                        points: 10, // 10req/h
                        duration: 60 * 60, // every hour
                        blockDuration: 0,
                        keyPrefix: (userId: string) => `ratelimit:password:reset:${userId}`,
                    },
                },
                email: {
                    verify: {
                        points: 3, // 3req/h per email
                        duration: 60 * 60, // every hour
                        blockDuration: 0,
                        keyPrefix: (email: string) => `ratelimit:email:verify:${email}`,
                    },
                },
                multiFa: {
                    points: 5, // 5req/10min
                    duration: 60 * 10, // every 10 min
                    blockDuration: 0,
                    keyPrefix: (userId: string) => `ratelimit:2fa:user:${userId}`,
                },
            },
            protected: {
                normal: {
                    points: 60, // 60 requests per minute
                    duration: 60,
                    blockDuration: 0,
                    keyPrefix: (userId: string) => `ratelimit:protected:normal:${userId}`,
                },
                medium: {
                    points: 40, // 40 requests per minute
                    duration: 60,
                    blockDuration: 60, // 1 minute block
                    keyPrefix: (userId: string) => `ratelimit:protected:medium:${userId}`,
                },
                sensitive: {
                    points: 20, // 20 requests per minute
                    duration: 60,
                    blockDuration: 300, // 5 minutes block
                    keyPrefix: (userId: string) => `ratelimit:protected:sensitive:${userId}`,
                },
            },
        },
        arcjet: {
            ARCJET_ENV: process.env.ARCJET_ENV || 'development',
            ARCJET_KEY: process.env.ARCJET_KEY || '',
        },

        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
        corsOrigin: process.env.CORS_ORIGIN?.split(',') || [
            'http://localhost:3000',
            'http://localhost:8080/',
            'http://localhost:4200',
            'http://192.168.8.28:8080',
            'http://127.0.0.1:8080',
        ],
        corsCredentials: process.env.CORS_CREDENTIALS === 'true',

        // 2FA Configuration
        twoFA: {
            serviceName: process.env.TWO_FA_SERVICE_NAME || 'B2B Todo App',
            issuer: process.env.TWO_FA_ISSUER || 'B2B Todo',
            window: 2, // Allow 2 time steps before and after current time
        },
    },

    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY!,
        sourceSecret: process.env.STRIPE_WEBHOOK_SECRET!,
        mainProduct: process.env.STRIPE_MAIN_PRODUCT_ID!,
        baseUrl: process.env.BILLING_BASE_URL || 'http://localhost:3003',
    },

    // Logging Configuration
    logging: {
        sentry: {
            dsn: process.env.SENTRY_DSN!,
        },
    },

    contacts: {
        support: process.env.SUPPORT_EMAIL || 'support@yourdomain.com',
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

    // Validate bcrypt rounds
    if (
        isNaN(config.security.bcryptRounds) ||
        config.security.bcryptRounds < 4 ||
        config.security.bcryptRounds > 20
    ) {
        errors.push('Invalid bcrypt rounds (should be between 4 and 20)');
    }

    if (errors.length > 0) {
        throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }
}

export default config;
