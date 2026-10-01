import { config } from '@/configs';
import { AppContext } from '@/core/middlewares/auth.middleware';
import {
    createRateLimitMiddleware,
    createSlidingWindowLimiter,
} from '@/core/middlewares/rate-limiter.middleware';

// Rate limiters
export const planReadRateLimiter = async (c: AppContext, next: () => Promise<void>) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.protected.normal.points,
            duration: config.security.rateLimiter.protected.normal.duration,
            blockDuration: config.security.rateLimiter.protected.normal.blockDuration,
        }),
        c => {
            const user = (c as any).user;
            if (user && user.userId) {
                return config.security.rateLimiter.protected.normal.keyPrefix(user.userId);
            }

            // Fallback to IP for unauthenticated users
            const ip =
                c.req.header('CF-Connecting-IP') ||
                c.req.header('X-Forwarded-For') ||
                c.req.header('X-Real-IP') ||
                'unknown';
            const cleanIp = ip.split(',')[0].trim();
            return `plan:read:ip:${cleanIp}`;
        },
        'Too many plan read requests'
    );
    return limiter(c, next);
};

export const planWriteRateLimiter = async (c: AppContext, next: () => Promise<void>) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.protected.medium.points,
            duration: config.security.rateLimiter.protected.medium.duration,
            blockDuration: config.security.rateLimiter.protected.medium.blockDuration,
        }),
        c => config.security.rateLimiter.protected.medium.keyPrefix((c as any).user.userId),
        'Too many plan write requests'
    );
    return limiter(c, next);
};
