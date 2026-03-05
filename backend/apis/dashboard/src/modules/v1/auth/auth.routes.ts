import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import { AuthController } from '@/modules/v1/auth/auth.controller';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { requireRecentOTP } from '@/core/middlewares/otp.middleware';

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
    Setup2FASchema,
    Verify2FASetupSchema,
    Login2FASchema,
    Resend2FAOTPSchema,
    RequestSensitiveOTPSchema,
    VerifySensitiveOTPSchema,
} from './auth.schema';
import {
    registerRateLimiter,
    loginRateLimiter,
    refreshTokenRateLimiter,
    forgotPasswordRateLimiter,
    resetPasswordRateLimiter,
    verifyEmailRateLimiter,
    profileUpdateRateLimiter,
    preferencesReadRateLimiter,
    preferencesUpdateRateLimiter,
    changePasswordProtectedRateLimiter,
    logoutProtectedRateLimiter,
    profileReadRateLimiter,
} from './auth.rate-limiter';

const auth = new Hono();

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
    requireRecentOTP('update_profile'),
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

auth.get('/profile/preferences', preferencesReadRateLimiter, AuthController.getPreferences);
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
auth.post('/resend-verification', profileUpdateRateLimiter, AuthController.resendEmailVerification);

// 2FA Routes
auth.post(
    '/2fa/setup',
    authenticate,
    zValidator('json', Setup2FASchema, (result, c) => {
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
    AuthController.setup2FA
);

auth.post(
    '/2fa/verify-setup',
    authenticate,
    zValidator('json', Verify2FASetupSchema, (result, c) => {
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
    AuthController.verify2FASetup
);

auth.post(
    '/2fa/login',
    loginRateLimiter,
    zValidator('json', Login2FASchema, (result, c) => {
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
    AuthController.login2FA
);

auth.post(
    '/2fa/resend',
    loginRateLimiter,
    zValidator('json', Resend2FAOTPSchema, (result, c) => {
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
    AuthController.resend2FAOTP
);

auth.post('/2fa/disable', authenticate, requireRecentOTP('disable_2fa'), AuthController.disable2FA);

// OTP for sensitive actions
auth.post(
    '/otp/request',
    authenticate,
    zValidator('json', RequestSensitiveOTPSchema, (result, c) => {
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
    AuthController.requestSensitiveOTP
);

auth.post(
    '/otp/verify',
    authenticate,
    zValidator('json', VerifySensitiveOTPSchema, (result, c) => {
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
    AuthController.verifySensitiveOTP
);

// Admin routes (admin role required)
// auth.use('/admin/*', authenticate, requireAdmin);

// Add admin-specific routes here if needed
// auth.get('/admin/users', AdminController.getAllUsers);

export default auth;
