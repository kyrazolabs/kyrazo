import { getConnInfo } from 'hono/bun';

import { AppContext } from '@/core/middlewares/auth.middleware';
import { config } from '@/configs/app';
import {
    createSlidingWindowLimiter,
    createRateLimitMiddleware,
} from '@/core/middlewares/rate-limiter.middleware';
import { IErrorResponse } from '@kyrazo/shared';

// Helper function to get IP
const getIp = (c: AppContext) => {
    const ip = getConnInfo(c).remote.address;
    return ip || 'unknown';
};

// Lazy rate limiter wrappers for auth routes
export const registerRateLimiter = async (c: AppContext, next: () => Promise<void>) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.auth.register.points,
            duration: config.security.rateLimiter.auth.register.duration,
            blockDuration: config.security.rateLimiter.auth.register.blockDuration,
        }),
        c => config.security.rateLimiter.auth.register.keyPrefix(getIp(c)),
        'Too many registration attempts'
    );
    return limiter(c, next);
};

export const loginRateLimiter = async (c: AppContext, next: () => Promise<void>) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.auth.login.points,
            duration: config.security.rateLimiter.auth.login.duration,
            blockDuration: config.security.rateLimiter.auth.login.blockDuration,
        }),
        c => config.security.rateLimiter.auth.login.bots.keyPrefix(getIp(c)),
        'Too many login attempts'
    );
    return limiter(c, next);
};

export const refreshTokenRateLimiter = async (c: AppContext, next: () => Promise<void>) => {
    const limiter = createSlidingWindowLimiter({
        points: config.security.rateLimiter.auth.token.refresh.points,
        duration: config.security.rateLimiter.auth.token.refresh.duration,
        blockDuration: config.security.rateLimiter.auth.token.refresh.blockDuration,
    });

    try {
        const key = config.security.rateLimiter.auth.token.refresh.keyPrefix(getIp(c));
        await limiter.consume(key);
        await next();
    } catch (rejRes: any) {
        return c.json<IErrorResponse>(
            {
                success: false,
                error: {
                    code: 'REFRESH_TOKEN_INVALID_OR_SUSPENDED',
                    message: 'Refresh token is invalid or suspended.',
                    requestId: c.get('requestId'),
                },
            },
            401
        );
    }
};

export const forgotPasswordRateLimiter = async (c: AppContext, next: () => Promise<void>) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.auth.password.forgot.points,
            duration: config.security.rateLimiter.auth.password.forgot.duration,
            blockDuration: config.security.rateLimiter.auth.password.forgot.blockDuration,
        }),
        c =>
            config.security.rateLimiter.auth.password.forgot.keyPrefix(
                (c.req as any).valid('json').email
            ),
        'Too many password reset requests'
    );
    return limiter(c, next);
};

export const resetPasswordRateLimiter = async (c: AppContext, next: () => Promise<void>) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.auth.password.reset.points,
            duration: config.security.rateLimiter.auth.password.reset.duration,
            blockDuration: config.security.rateLimiter.auth.password.reset.blockDuration,
        }),
        c => config.security.rateLimiter.auth.password.reset.keyPrefix(getIp(c)),
        'Too many password reset attempts'
    );
    return limiter(c, next);
};

export const verifyEmailRateLimiter = async (c: AppContext, next: () => Promise<void>) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.auth.email.verify.points,
            duration: config.security.rateLimiter.auth.email.verify.duration,
            blockDuration: config.security.rateLimiter.auth.email.verify.blockDuration,
        }),
        c =>
            config.security.rateLimiter.auth.email.verify.keyPrefix(
                (c.req as any).valid('json').email
            ),
        'Too many email verification attempts'
    );
    return limiter(c, next);
};

export const changePasswordProtectedRateLimiter = async (
    c: AppContext,
    next: () => Promise<void>
) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.protected.sensitive.points,
            duration: config.security.rateLimiter.protected.sensitive.duration,
            blockDuration: config.security.rateLimiter.protected.sensitive.blockDuration,
        }),
        c => config.security.rateLimiter.protected.sensitive.keyPrefix((c as any).user.userId),
        'Too many password change requests'
    );
    return limiter(c, next);
};

export const logoutProtectedRateLimiter = async (c: AppContext, next: () => Promise<void>) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.protected.normal.points,
            duration: config.security.rateLimiter.protected.normal.duration,
            blockDuration: config.security.rateLimiter.protected.normal.blockDuration,
        }),
        c => config.security.rateLimiter.protected.normal.keyPrefix((c as any).user.userId),
        'Too many logout requests'
    );
    return limiter(c, next);
};
