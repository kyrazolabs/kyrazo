import { config } from '@/configs';
import { AppContext } from '@/core/middlewares/auth.middleware';
import {
    createRateLimitMiddleware,
    createSlidingWindowLimiter,
} from '@/core/middlewares/ratelimit.middleware';

/**
 * Rate limiter for testing transforms.
 * Limit: 20 tests per minute per customer (userId).
 */
export const transformTestRateLimiter = async (c: AppContext, next: () => Promise<void>) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: 20,
            duration: 60,
            blockDuration: 60,
        }),
        c => `rate_limit:transform_test:${(c as any).user.userId}`,
        'Too many transform test requests. Please wait a minute.'
    );
    return limiter(c, next);
};

/**
 * Standard read/write rate limiters for other transform operations.
 * Using existing security config values.
 */
export const transformReadRateLimiter = async (c: AppContext, next: () => Promise<void>) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.protected.normal.points,
            duration: config.security.rateLimiter.protected.normal.duration,
            blockDuration: config.security.rateLimiter.protected.normal.blockDuration,
        }),
        c => config.security.rateLimiter.protected.normal.keyPrefix((c as any).user.userId),
        'Too many requests'
    );
    return limiter(c, next);
};

export const transformWriteRateLimiter = async (c: AppContext, next: () => Promise<void>) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.protected.medium.points,
            duration: config.security.rateLimiter.protected.medium.duration,
            blockDuration: config.security.rateLimiter.protected.medium.blockDuration,
        }),
        c => config.security.rateLimiter.protected.medium.keyPrefix((c as any).user.userId),
        'Too many requests'
    );
    return limiter(c, next);
};
