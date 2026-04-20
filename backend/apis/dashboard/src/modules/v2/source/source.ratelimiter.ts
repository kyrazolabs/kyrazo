import { config } from '@/configs';
import { AppContext } from '@/core/middlewares/auth.middleware';
import {
    createRateLimitMiddleware,
    createSlidingWindowLimiter,
} from '@/core/middlewares/rate-limiter.middleware';

/**
 * Standard read/write rate limiters for source operations.
 * Using existing security config values.
 */
export const sourceReadRateLimiter = async (c: AppContext, next: () => Promise<void>) => {
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

export const sourceWriteRateLimiter = async (c: AppContext, next: () => Promise<void>) => {
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
