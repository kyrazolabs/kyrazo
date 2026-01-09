import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redisConfig } from '@/configs';
import { Context } from 'hono';
import { getConnInfo } from 'hono/bun';
import { LimitChecker } from '../services/limit.checker';
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
    keyExtractor: (c: Context) => string,
    errorMessage: string = 'Too many requests, please try again later.'
) {
    return async (c: Context, next: () => Promise<void>) => {
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
 * @title Ingest Rate Limiter Middleware
 * @description Token bucket rate limiter for ingest endpoints (20 tokens, refill 1s default)
 * @param options - Configuration options
 * @returns Hono middleware function
 */
export function createIngestRateLimiter(
    options: {
        points?: number;
        duration?: number;
        blockDuration?: number;
        keyExtractor?: (c: Context) => string;
    } = {}
) {
    const limiter = createTokenBucketLimiter({
        keyPrefix: 'ingest',
        points: options.points || 20,
        duration: options.duration || 1,
        blockDuration: options.blockDuration || 10,
    });

    const keyExtractor =
        options.keyExtractor ||
        ((c: Context) => {
            // Extract IP for ingest endpoints
            const ip = getConnInfo(c).remote.address || 'unknown';
            return `ingest:ip:${ip}`;
        });

    return createRateLimitMiddleware(
        limiter,
        keyExtractor,
        'Ingest rate limit exceeded. Please slow down your requests.'
    );
}

// Map to cache rate limiters by RPS (Requests Per Second)
const limitersCache = new Map<number, RateLimiterRedis>();

const getLimiterByRPS = (rps: number): RateLimiterRedis => {
    if (!limitersCache.has(rps)) {
        limitersCache.set(
            rps,
            new RateLimiterRedis({
                storeClient: redisConfig.getClient(),
                keyPrefix: 'rate_limit',
                points: rps,
                duration: 1, // Per second
            })
        );
    }
    return limitersCache.get(rps)!;
};

/**
 * @title Workspace Rate Limiter Middleware
 * @description Applies rate limiting based on workspace plan (eventsPerSecond).
 * @param keyExtractor Function to extract workspaceId from context
 */
export function createWorkspaceRateLimiter(
    keyExtractor: (
        c: Context
    ) => string | undefined | Promise<string | undefined>
) {
    return async (c: Context, next: () => Promise<void>) => {
        try {
            const workspaceId = await keyExtractor(c);

            if (!workspaceId) {
                // If no workspaceId, strict fallback (e.g. 5 req/s)
                const fallbackLimiter = getLimiterByRPS(0);
                await fallbackLimiter.consume(
                    getConnInfo(c).remote.address || 'unknown'
                );
                await next();
                return;
            }

            // Get limits from LimitChecker (cached)
            const limits = await LimitChecker.getWorkspaceSub(workspaceId);
            const rps = limits?.eventsPerSecond || 10; // Default to 10 if missing

            const limiter = getLimiterByRPS(rps);

            await limiter.consume(workspaceId);
            await next();
        } catch (rejRes: any) {
            const msBeforeNext = rejRes.msBeforeNext || 0;
            const key = (await keyExtractor(c)) || 'unknown';
            logger.warn(
                `Rate limit exceeded for workspace ${key}, retry in ${msBeforeNext}ms`
            );

            return c.json(
                {
                    success: false,
                    error: {
                        code: 'RATE_LIMIT_EXCEEDED',
                        message:
                            'Too many requests. Please upgrade your plan or slow down.',
                        retryAfter: Math.ceil(msBeforeNext / 1000),
                    },
                },
                429
            );
        }
    };
}

/**
 * @title Pre-configured Rate Limiters
 * @description Ready-to-use rate limiter instances (lazy initialized)
 */

// Lazy initialization for ingest rate limiter
let _ingestRateLimiterInstance: ReturnType<
    typeof createRateLimitMiddleware
> | null = null;

export const getIngestRateLimiter = () => {
    return async (c: Context, next: () => Promise<void>) => {
        if (!_ingestRateLimiterInstance) {
            _ingestRateLimiterInstance = createIngestRateLimiter();
        }
        return _ingestRateLimiterInstance(c, next);
    };
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
    createIngestRateLimiter,
    getIngestRateLimiter,
    createWorkspaceRateLimiter,
    RateLimiterUtils,
};
