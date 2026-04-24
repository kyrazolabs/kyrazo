import { Hono } from 'hono';
import { validate } from '@/core/middlewares/validator.middleware';

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
    changePasswordProtectedRateLimiter,
    logoutProtectedRateLimiter,
} from './auth.ratelimiter';
import {
    profileReadRateLimiter,
    profileUpdateRateLimiter,
} from '@/modules/v1/profile/profile.ratelimiter';

const auth = new Hono();

// Public routes (no authentication required)
auth.post(
    '/register',
    registerRateLimiter,
    validate('json', RegisterSchema),
    AuthController.register
);
auth.post('/login', loginRateLimiter, validate('json', LoginSchema), AuthController.login);

auth.post('/google', loginRateLimiter, validate('json', GoogleLoginSchema), AuthController.google);

auth.post(
    '/refresh-token',
    refreshTokenRateLimiter,
    validate('json', RefreshTokenSchema),
    AuthController.refreshToken
);

auth.post(
    '/forgot-password',
    validate('json', ForgotPasswordSchema),
    forgotPasswordRateLimiter,
    AuthController.forgotPassword
);

auth.post(
    '/reset-password',
    resetPasswordRateLimiter,
    validate('json', ResetPasswordSchema),
    AuthController.resetPassword
);

auth.post(
    '/verify-email',
    validate('json', VerifyEmailSchema),
    verifyEmailRateLimiter,
    AuthController.verifyEmail
);

// Protected routes (authentication required)
auth.use('/change-password', authenticate);
auth.use('/logout', authenticate);

auth.post(
    '/change-password',
    changePasswordProtectedRateLimiter,
    validate('json', ChangePasswordSchema),
    AuthController.changePassword
);

auth.post(
    '/logout',
    logoutProtectedRateLimiter,
    validate('json', RefreshTokenSchema),
    AuthController.logout
);

auth.get(
    '/email-verification-status',
    profileReadRateLimiter,
    AuthController.getEmailVerificationStatus
);
auth.post('/resend-verification', profileUpdateRateLimiter, AuthController.resendEmailVerification);

// 2FA Routes
auth.post('/2fa/setup', authenticate, validate('json', Setup2FASchema), AuthController.setup2FA);

auth.post(
    '/2fa/verify-setup',
    authenticate,
    validate('json', Verify2FASetupSchema),
    AuthController.verify2FASetup
);

auth.post(
    '/2fa/login',
    loginRateLimiter,
    validate('json', Login2FASchema),
    AuthController.login2FA
);

auth.post(
    '/2fa/resend',
    loginRateLimiter,
    validate('json', Resend2FAOTPSchema),
    AuthController.resend2FAOTP
);

auth.post('/2fa/disable', authenticate, requireRecentOTP('disable_2fa'), AuthController.disable2FA);

// OTP for sensitive actions
auth.post(
    '/otp/request',
    authenticate,
    validate('json', RequestSensitiveOTPSchema),
    AuthController.requestSensitiveOTP
);

auth.post(
    '/otp/verify',
    authenticate,
    validate('json', VerifySensitiveOTPSchema),
    AuthController.verifySensitiveOTP
);

// Admin routes (admin role required)
// auth.use('/admin/*', authenticate, requireAdmin);

// Add admin-specific routes here if needed
// auth.get('/admin/users', AdminController.getAllUsers);

export default auth;
