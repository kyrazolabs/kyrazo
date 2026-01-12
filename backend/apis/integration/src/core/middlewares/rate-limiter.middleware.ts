import type { AppContext } from '@/core/middlewares/auth.middleware';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redisConfig } from '@/configs';
import { logger } from '@kyrazo/shared';

/**
 * @title Rate Limiter Configuration
 * @description Configuration options for different rate limiters
 */
export interface RateLimiterConfig {
    keyPrefix?: string;
    points: number; // Number of requests
    duration: number; // Per duration in seconds
    blockDuration?: number; // Block duration in seconds
}

/**
 * @title Sliding Window Counter Rate Limiter by User ID
 * @description Creates a sliding window rate limiter that tracks requests by user ID
 * @param config - Rate limiter configuration
 */
export function createSlidingWindowLimiter(
    config: RateLimiterConfig
): RateLimiterRedis {
    return new RateLimiterRedis({
        storeClient: redisConfig.getClient(),
        keyPrefix: config.keyPrefix || 'sliding_window',
        points: config.points, // Number of requests
        duration: config.duration, // Per duration in seconds
        blockDuration: config.blockDuration || 0, // Block duration
    });
}

/**
 * @title Fixed Window Rate Limiter by User ID
 * @description Creates a fixed window rate limiter that tracks requests by user ID
 * @param config - Rate limiter configuration
 */
export function createFixedWindowLimiter(
    config: RateLimiterConfig
): RateLimiterRedis {
    return new RateLimiterRedis({
        storeClient: redisConfig.getClient(),
        keyPrefix: config.keyPrefix || 'fixed_window',
        points: config.points, // Number of requests
        duration: config.duration, // Per duration in seconds
        blockDuration: config.blockDuration || 0, // Block duration
    });
}

/**
 * @title Token Bucket Rate Limiter by Key
 * @description Creates a token bucket rate limiter that tracks requests by any key
 * @param config - Rate limiter configuration
 */
export function createTokenBucketLimiter(
    config: RateLimiterConfig
): RateLimiterRedis {
    return new RateLimiterRedis({
        storeClient: redisConfig.getClient(),
        keyPrefix: config.keyPrefix || 'token_bucket',
        points: config.points, // Number of tokens
        duration: config.duration, // Refill duration in seconds
        blockDuration: config.blockDuration || 0, // Block duration
    });
}

/**
 * @title Rate Limiter Middleware Factory
 * @description Creates a middleware function for rate limiting
 * @param limiter - Rate limiter instance
 * @param keyExtractor - Function to extract the key from the request
 * @param errorMessage - Custom error message
 * @returns Hono middleware function
 */
export function createRateLimitMiddleware(
    limiter: RateLimiterRedis,
    keyExtractor: (c: AppContext) => string,
    errorMessage: string = 'Too many requests, please try again later.'
) {
    return async (c: AppContext, next: () => Promise<void>) => {
        try {
            const key = keyExtractor(c);

            if (!key) {
                logger.warn('Rate limiter: No key extracted from request');
                return c.json(
                    {
                        success: false,
                        error: {
                            code: 'RATE_LIMIT_KEY_MISSING',
                            message:
                                'Unable to identify request for rate limiting',
                        },
                    },
                    400
                );
            }

            await limiter.consume(key);
            await next();
        } catch (rejRes: any) {
            const msBeforeNext = rejRes.msBeforeNext || 0;
            const remainingPoints = rejRes.remainingPoints || 0;

            logger.warn(
                `Rate limit exceeded for key: ${keyExtractor(c)}, remaining: ${remainingPoints}, retry in: ${msBeforeNext}ms`
            );

            return c.json(
                {
                    success: false,
                    error: {
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: errorMessage,
                        retryAfter: Math.ceil(msBeforeNext / 1000), // seconds
                        remainingRequests: remainingPoints,
                    },
                },
                429
            );
        }
    };
}

/**
 * @title Publish Endpoint Rate Limiter Middleware
 * @description Token bucket rate limiter for publish endpoints (30 req/s default)
 * @param options - Configuration options
 * @returns Hono middleware function
 */
export function createSDKsRateLimiter(
    options: {
        points?: number;
        duration?: number;
        blockDuration?: number;
        keyExtractor?: (c: AppContext) => string;
    } = {}
) {
    const limiter = createTokenBucketLimiter({
        keyPrefix: 'publish',
        points: options.points || 20, // 30 tokens (requests per second)
        duration: options.duration || 1, // refill every 1 second
        blockDuration: options.blockDuration || 10, // 10 seconds block
    });

    const keyExtractor =
        options.keyExtractor ||
        ((c: AppContext) => {
            // Extract API key or user ID for publish endpoints
            const apiKey = c.req.header('x-api-key') || c.req.query('api_key');
            if (apiKey) {
                return `publish:api:${apiKey}`;
            }

            // Fallback to user ID if authenticated
            const user = (c as any).user;
            if (user && user.userId) {
                return `publish:user:${user.userId}`;
            }

            // Fallback to IP
            const ip =
                c.req.header('CF-Connecting-IP') ||
                c.req.header('X-Forwarded-For') ||
                c.req.header('X-Real-IP') ||
                'unknown';
            const cleanIp = ip.split(',')[0].trim();
            return `publish:ip:${cleanIp}`;
        });

    return createRateLimitMiddleware(
        limiter,
        keyExtractor,
        'Publish rate limit exceeded. Please slow down your requests.'
    );
}

/**
 * @title Pre-configured Rate Limiters
 * @description Ready-to-use rate limiter instances (lazy initialized)
 */

// Lazy initialization for SDK rate limiter
let _sdksRateLimiter: ReturnType<typeof createRateLimitMiddleware> | null =
    null;

export const getSDKsRateLimiter = () => {
    if (!_sdksRateLimiter) {
        _sdksRateLimiter = createSDKsRateLimiter();
    }
    return _sdksRateLimiter;
};

/**
 * @title Rate Limiter Utilities
 * @description Helper functions for rate limiting
 */
export class RateLimiterUtils {
    /**
     * Get remaining points for a key
     */
    static async getRemainingPoints(
        limiter: RateLimiterRedis,
        key: string
    ): Promise<number> {
        try {
            const res = await limiter.get(key);
            return res ? res.remainingPoints : limiter.points;
        } catch (error) {
            logger.error('Error getting remaining points:', error as Error);
            return 0;
        }
    }

    /**
     * Get time until next reset for a key
     */
    static async getMsBeforeNext(
        limiter: RateLimiterRedis,
        key: string
    ): Promise<number> {
        try {
            const res = await limiter.get(key);
            return res ? res.msBeforeNext : 0;
        } catch (error) {
            logger.error('Error getting ms before next:', error as Error);
            return 0;
        }
    }

    /**
     * Delete rate limit data for a key
     */
    static async deleteKey(
        limiter: RateLimiterRedis,
        key: string
    ): Promise<boolean> {
        try {
            await limiter.delete(key);
            return true;
        } catch (error) {
            logger.error('Error deleting rate limit key:', error as Error);
            return false;
        }
    }
}

export default {
    createSlidingWindowLimiter,
    createFixedWindowLimiter,
    createTokenBucketLimiter,
    createRateLimitMiddleware,
    RateLimiterUtils,
};
