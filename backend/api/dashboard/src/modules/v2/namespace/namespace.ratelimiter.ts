import { config } from '@/configs';
import { AppContext } from '@/core/middlewares/auth.middleware';
import {
    createRateLimitMiddleware,
    createSlidingWindowLimiter,
} from '@/core/middlewares/ratelimit.middleware';

/**
 * Standard read/write rate limiters for namespace operations.
 */
export const namespaceReadRateLimiter = async (c: AppContext, next: () => Promise<void>) => {
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

export const namespaceWriteRateLimiter = async (c: AppContext, next: () => Promise<void>) => {
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
