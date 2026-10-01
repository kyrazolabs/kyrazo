import { config } from '@/configs';
import { AppContext } from '@/core/middlewares/auth.middleware';
import {
    createRateLimitMiddleware,
    createSlidingWindowLimiter,
} from '@/core/middlewares/rate-limiter.middleware';

// Lazy wrappers for target routes rate limiters (user-based)
export const targetReadRateLimiter = async (
    c: AppContext,
    next: () => Promise<void>
) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.protected.normal.points,
            duration: config.security.rateLimiter.protected.normal.duration,
            blockDuration:
                config.security.rateLimiter.protected.normal.blockDuration,
        }),
        c =>
            config.security.rateLimiter.protected.normal.keyPrefix(
                (c as any).user.userId
            ),
        'Too many target read requests'
    );
    return limiter(c, next);
};

export const targetWriteRateLimiter = async (
    c: AppContext,
    next: () => Promise<void>
) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.protected.medium.points,
            duration: config.security.rateLimiter.protected.medium.duration,
            blockDuration:
                config.security.rateLimiter.protected.medium.blockDuration,
        }),
        c =>
            config.security.rateLimiter.protected.medium.keyPrefix(
                (c as any).user.userId
            ),
        'Too many target write requests'
    );
    return limiter(c, next);
};
