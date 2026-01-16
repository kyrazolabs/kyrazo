import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getConnInfo } from 'hono/bun';

import { AuthController } from '@/modules/v1/auth/auth.controller';
import { AppContext, authenticate } from '@/core/middlewares/auth.middleware';
import { config } from '@/configs/app';
import {
    createSlidingWindowLimiter,
    createRateLimitMiddleware,
} from '@/core/middlewares/rate-limiter.middleware';
import {
    RegisterSchema,
    LoginSchema,
    RefreshTokenSchema,
    ForgotPasswordSchema,
    ResetPasswordSchema,
    VerifyEmailSchema,
    ChangePasswordSchema,
    UpdateProfileSchema,
    UpdatePreferencesSchema,
    GoogleLoginSchema,
} from './auth.schema';
import { IErrorResponse } from '@kyrazo/shared';

const auth = new Hono();

// Helper function to get IP
const getIp = (c: AppContext) => {
    const ip = getConnInfo(c).remote.address;
    return ip || 'unknown';
};

// Lazy rate limiter wrappers for auth routes
const registerRateLimiter = async (
    c: AppContext,
    next: () => Promise<void>
) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.auth.register.points,
            duration: config.security.rateLimiter.auth.register.duration,
            blockDuration:
                config.security.rateLimiter.auth.register.blockDuration,
        }),
        c => config.security.rateLimiter.auth.register.keyPrefix(getIp(c)),
        'Too many registration attempts'
    );
    return limiter(c, next);
};

const loginRateLimiter = async (c: AppContext, next: () => Promise<void>) => {
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

const refreshTokenRateLimiter = async (
    c: AppContext,
    next: () => Promise<void>
) => {
    const limiter = createSlidingWindowLimiter({
        points: config.security.rateLimiter.auth.token.refresh.points,
        duration: config.security.rateLimiter.auth.token.refresh.duration,
        blockDuration:
            config.security.rateLimiter.auth.token.refresh.blockDuration,
    });

    try {
        const key = config.security.rateLimiter.auth.token.refresh.keyPrefix(
            getIp(c)
        );
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

const forgotPasswordRateLimiter = async (
    c: AppContext,
    next: () => Promise<void>
) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.auth.password.forgot.points,
            duration: config.security.rateLimiter.auth.password.forgot.duration,
            blockDuration:
                config.security.rateLimiter.auth.password.forgot.blockDuration,
        }),
        c =>
            config.security.rateLimiter.auth.password.forgot.keyPrefix(
                (c.req as any).valid('json').email
            ),
        'Too many password reset requests'
    );
    return limiter(c, next);
};

const resetPasswordRateLimiter = async (
    c: AppContext,
    next: () => Promise<void>
) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.auth.password.reset.points,
            duration: config.security.rateLimiter.auth.password.reset.duration,
            blockDuration:
                config.security.rateLimiter.auth.password.reset.blockDuration,
        }),
        c =>
            config.security.rateLimiter.auth.password.reset.keyPrefix(getIp(c)),
        'Too many password reset attempts'
    );
    return limiter(c, next);
};

const verifyEmailRateLimiter = async (
    c: AppContext,
    next: () => Promise<void>
) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.auth.email.verify.points,
            duration: config.security.rateLimiter.auth.email.verify.duration,
            blockDuration:
                config.security.rateLimiter.auth.email.verify.blockDuration,
        }),
        c =>
            config.security.rateLimiter.auth.email.verify.keyPrefix(
                (c.req as any).valid('json').email
            ),
        'Too many email verification attempts'
    );
    return limiter(c, next);
};

// Lazy wrappers for protected routes rate limiters (user-based)
const profileReadRateLimiter = async (
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
        'Too many profile read requests'
    );
    return limiter(c, next);
};

const profileUpdateRateLimiter = async (
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
        'Too many profile update requests'
    );
    return limiter(c, next);
};

const preferencesReadRateLimiter = async (
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
        'Too many preferences read requests'
    );
    return limiter(c, next);
};

const preferencesUpdateRateLimiter = async (
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
        'Too many preferences update requests'
    );
    return limiter(c, next);
};

const changePasswordProtectedRateLimiter = async (
    c: AppContext,
    next: () => Promise<void>
) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.protected.sensitive.points,
            duration: config.security.rateLimiter.protected.sensitive.duration,
            blockDuration:
                config.security.rateLimiter.protected.sensitive.blockDuration,
        }),
        c =>
            config.security.rateLimiter.protected.sensitive.keyPrefix(
                (c as any).user.userId
            ),
        'Too many password change requests'
    );
    return limiter(c, next);
};

const logoutProtectedRateLimiter = async (
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
        'Too many logout requests'
    );
    return limiter(c, next);
};

// Public routes (no authentication required)
auth.post(
    '/register',
    registerRateLimiter,
    zValidator('json', RegisterSchema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: JSON.parse(result.error.message).map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
    }),
    AuthController.register
);
auth.post(
    '/login',
    loginRateLimiter,
    zValidator('json', LoginSchema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: JSON.parse(result.error.message).map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
    }),
    AuthController.login
);

auth.post(
    '/google',
    loginRateLimiter,
    zValidator('json', GoogleLoginSchema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: JSON.parse(result.error.message).map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
    }),
    AuthController.google
);

auth.post(
    '/refresh-token',
    refreshTokenRateLimiter,
    zValidator('json', RefreshTokenSchema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: JSON.parse(result.error.message).map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
    }),
    AuthController.refreshToken
);

auth.post(
    '/forgot-password',
    zValidator('json', ForgotPasswordSchema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: JSON.parse(result.error.message).map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
    }),
    forgotPasswordRateLimiter,
    AuthController.forgotPassword
);

auth.post(
    '/reset-password',
    resetPasswordRateLimiter,
    zValidator('json', ResetPasswordSchema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: JSON.parse(result.error.message).map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
    }),
    AuthController.resetPassword
);

auth.post(
    '/verify-email',
    zValidator('json', VerifyEmailSchema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: JSON.parse(result.error.message).map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
    }),
    verifyEmailRateLimiter,
    AuthController.verifyEmail
);

// Protected routes (authentication required)
auth.use('/profile/*', authenticate);
auth.use('/change-password', authenticate);
auth.use('/logout', authenticate);

auth.get('/profile', profileReadRateLimiter, AuthController.getProfile);
auth.patch(
    '/profile',
    profileUpdateRateLimiter,
    zValidator('json', UpdateProfileSchema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: JSON.parse(result.error.message).map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
    }),
    AuthController.updateProfile
);

auth.get(
    '/profile/preferences',
    preferencesReadRateLimiter,
    AuthController.getPreferences
);
auth.patch(
    '/profile/preferences',
    preferencesUpdateRateLimiter,
    zValidator('json', UpdatePreferencesSchema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: JSON.parse(result.error.message).map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
    }),
    AuthController.updatePreferences
);

auth.post(
    '/change-password',
    changePasswordProtectedRateLimiter,
    zValidator('json', ChangePasswordSchema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: JSON.parse(result.error.message).map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
    }),
    AuthController.changePassword
);

auth.post(
    '/logout',
    logoutProtectedRateLimiter,
    zValidator('json', RefreshTokenSchema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: JSON.parse(result.error.message).map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
    }),
    AuthController.logout
);

auth.get(
    '/email-verification-status',
    profileReadRateLimiter,
    AuthController.getEmailVerificationStatus
);
auth.post(
    '/resend-verification',
    profileUpdateRateLimiter,
    AuthController.resendEmailVerification
);

// Admin routes (admin role required)
// auth.use('/admin/*', authenticate, requireAdmin);

// Add admin-specific routes here if needed
// auth.get('/admin/users', AdminController.getAllUsers);

export default auth;
