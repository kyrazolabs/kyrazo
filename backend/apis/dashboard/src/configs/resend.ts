import { Resend } from 'resend';
import config from './app';

// Validate required environment variables
const requiredEnvVars = ['RESEND_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    throw new Error(
        `Missing required environment variables for Resend: ${missingEnvVars.join(', ')}`
    );
}

/**
 * @title Resend Email Configuration
 * @description Configuration for Resend email service including API key, rate limiting, and retry settings.
 */
export const resendConfig = {
    // API Configuration
    apiKey: config.email.resend.apiKey!,

    // Rate Limiting
    rateLimit: {
        maxRequestsPerSecond: parseInt(process.env.RESEND_RATE_LIMIT || '10'),
        maxRequestsPerMinute: parseInt(
            process.env.RESEND_RATE_LIMIT_MINUTE || '100'
        ),
    },

    // Retry Configuration
    retry: {
        attempts: parseInt(process.env.RESEND_RETRY_ATTEMPTS || '3'),
        backoffMs: parseInt(process.env.RESEND_RETRY_BACKOFF || '1000'),
    },

    // Source Configuration (for delivery tracking)
    sources: {
        enabled: process.env.RESEND_WEBHOOKS_ENABLED === 'true',
        secret: process.env.RESEND_WEBHOOK_SECRET,
    },

    // Template Configuration
    templates: {
        baseUrl: process.env.APP_URL || 'http://localhost:3003',
        brandName: process.env.BRAND_NAME || 'Hookify',
        supportEmail: process.env.SUPPORT_EMAIL || 'delivered@resend.dev',
    },
};

/**
 * @title Resend Client Instance
 * @description Initialized Resend client instance for sending emails.
 */
export const resend = new Resend(config.email.resend.apiKey);

/**
 * @title Validate Resend Configuration
 * @description Validates the Resend configuration and throws an error if any required config is missing or invalid.
 * @returns {void}
 * @throws {Error} If configuration is invalid.
 */
export function validateResendConfig(): void {
    const errors: string[] = [];

    // Validate API key format (basic check)
    if (!resendConfig.apiKey.startsWith('re_')) {
        errors.push('Invalid Resend API key format');
    }

    // Validate rate limits
    if (resendConfig.rateLimit.maxRequestsPerSecond < 1) {
        errors.push('Max requests per second must be at least 1');
    }

    if (resendConfig.rateLimit.maxRequestsPerMinute < 1) {
        errors.push('Max requests per minute must be at least 1');
    }

    // Validate retry settings
    if (resendConfig.retry.attempts < 0 || resendConfig.retry.attempts > 10) {
        errors.push('Retry attempts must be between 0 and 10');
    }

    if (resendConfig.retry.backoffMs < 100) {
        errors.push('Retry backoff must be at least 100ms');
    }

    if (errors.length > 0) {
        throw new Error(
            `Resend configuration validation failed: ${errors.join(', ')}`
        );
    }
}

export default resend;
