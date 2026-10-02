import type { Context } from 'hono';
import { getConnInfo } from 'hono/bun';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { LimitChecker } from '../services/limit.checker';
import { config, redisConfig } from '@/configs';
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
 * @title Token Bucket Rate Limiter by Key
 * @description Creates a token bucket rate limiter that tracks requests by any key
 * @param config - Rate limiter configuration
 */
export function createTokenBucketLimiter(config: RateLimiterConfig): RateLimiterRedis {
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
                            message: 'Unable to identify request for rate limiting',
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

// Map to cache rate limiters by RPS
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
 * @title Dynamic Rate Limiter Middleware
 * @description Applies rate limiting based on workspace plan (eventsPerSecond).
 * @param keyExtractor Function to extract workspaceId from context
 */
export function createDynamicRateLimiter(
    keyExtractor: (c: Context) => string | undefined | Promise<string | undefined>
) {
    return async (c: Context, next: () => Promise<void>) => {
        try {
            const workspaceId = await keyExtractor(c);

            if (!workspaceId) {
                // If no workspaceId, strict fallback (e.g. 5 req/s)
                const fallbackLimiter = getLimiterByRPS(5);
                await fallbackLimiter.consume(getConnInfo(c).remote.address || 'unknown');
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
            logger.warn(`Rate limit exceeded for workspace ${key}, retry in ${msBeforeNext}ms`);

            return c.json(
                {
                    success: false,
                    error: {
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: 'Too many requests. Please upgrade your plan or slow down.',
                        retryAfter: Math.ceil(msBeforeNext / 1000),
                    },
                },
                429
            );
        }
    };
}

export default {
    createTokenBucketLimiter,
    createRateLimitMiddleware,
    createDynamicRateLimiter,
};
