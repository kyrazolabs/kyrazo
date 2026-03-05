import { AppContext } from '@/core/middlewares/auth.middleware';
import { config } from '@/configs/app';
import {
    createSlidingWindowLimiter,
    createRateLimitMiddleware,
} from '@/core/middlewares/rate-limiter.middleware';

// Lazy wrapper for API key management rate limiter (user-based, sensitive operations)
export const keyManagementRateLimiter = async (c: AppContext, next: () => Promise<void>) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.protected.sensitive.points,
            duration: config.security.rateLimiter.protected.sensitive.duration,
            blockDuration: config.security.rateLimiter.protected.sensitive.blockDuration,
        }),
        c => config.security.rateLimiter.protected.sensitive.keyPrefix((c as any).user.userId),
        'Too many API key management requests'
    );
    return limiter(c, next);
};
