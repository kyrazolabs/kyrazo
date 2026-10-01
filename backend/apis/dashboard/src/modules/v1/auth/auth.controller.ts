import { TokenPayload } from 'google-auth-library';
import { getConnInfo } from 'hono/bun';
import { ConnInfo } from 'hono/conninfo';
import { deleteCookie, setSignedCookie, getSignedCookie } from 'hono/cookie';
import { config } from '@/configs';
import {
    AuthActionsResponse,
    AuthRefreshResponse,
    AuthResponse,
    IErrorResponse,
    IUser,
    logger,
    unprefixId,
} from '@kyrazo/shared';
import {
    ChangePasswordInput,
    ForgotPasswordInput,
    GoogleLoginInput,
    LoginInput,
    RegisterInput,
    ResetPasswordInput,
    VerifyEmailInput,
    Setup2FAInput,
    Verify2FASetupInput,
    Login2FAInput,
    RequestSensitiveOTPInput,
    VerifySensitiveOTPInput,
} from './auth.schema';
import { OTPService } from '@/shared/services/otp.service';
import { renderEmailVerificationEmail, renderPasswordResetEmail } from '@/templates/emails';
import { mailQueues, mailQueuesName } from '@/producers/jobs/v1/publishers';
import { authUtils } from '@/core/utils/libs/jwt';
import { AppContext } from '@/core/middlewares/auth.middleware';
import GoogleAuthConfig from '@/configs/google';
import { authRepository } from './auth.repo';
import { profileRepository } from '@/modules/v1/profile/profile.repo';

export class AuthController {
    /**
     * Register a new user
     */
    static async register(c: AppContext): Promise<Response> {
        try {
            // @ts-ignore
            const valid: RegisterInput = c.req.valid('json');
            const info: ConnInfo = getConnInfo(c);
            const userAgent = c.req.header('User-Agent');

            const existingUserByEmail = await authRepository.findUserByEmail(valid.email);

            if (existingUserByEmail) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'USER_EXISTS',
                            message: 'User with this email already exists',
                            requestId: c.get('requestId'),
                        },
                    },
                    405
                );
            }

            const data = {
                ...valid,
                ...info,
                userAgent,
                passwordHash: valid.password,
                emailVerificationToken: crypto.randomUUID(),
            };
            // Create new user with hashed password via repository
            const saved = await authRepository.createUser(data);

            if (!saved) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'INTERNAL_ERROR',
                            message: 'Something went wrong',
                            requestId: c.get('requestId'),
                        },
                    },
                    400
                );
            }

            await authRepository.createUserPreference({
                userId: unprefixId((saved as any).id),
                notification: {
                    sourceFailures: true,
                    dailySummary: true,
                    securityAlerts: true,
                    weeklyReports: true,
                    preferences: {
                        emailFrequency: 'immediate',
                        quietHours: '22:00-08:00',
                    },
                },
            });

            try {
                const verificationUrl = `${config.app.frontendUrl}/verify-email?token=${data.emailVerificationToken}`;

                const body = renderEmailVerificationEmail({
                    firstName: saved.firstName as string,
                    email: saved.email as string,
                    verificationUrl,
                    brandName: config.app.name,
                    supportEmail: config.contacts.support,
                });
                await mailQueues.sendMailHighPriorityQueue.waitUntilReady();

                await mailQueues.sendMailHighPriorityQueue.add(
                    mailQueuesName.sendMailHighPriorityQueueName,
                    {
                        to: saved.email as string,
                        subject: `Verify your ${config.app.name} email address`,
                        html: body,
                    }
                );
            } catch (mailError: any) {
                const error = mailError as any;
                logger.error(
                    'Unexpected error on sending verification mail in AuthController.register',
                    error
                );
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'SEND_VERIFICATION_FAILED',
                            message: error.message || 'Failed to send verification mail',
                            details: {
                                message: error.message,
                                name: error.name,
                                command: error.command,
                                stack: error.stack,
                            },
                            requestId: c.get('requestId'),
                        },
                    },
                    500
                );
            }

            const tempToken = await OTPService.generateTemp2FAToken((saved as any).id);
            await OTPService.generateAndSendEmailOTP(
                (saved as any).id,
                saved.email as string,
                '2fa_login'
            );

            return c.json<AuthResponse>(
                {
                    success: true,
                    message:
                        'Registration successful. Please enter the verification code sent to your email.',
                    pending_2fa: true,
                    method: 'email',
                    temp_token: tempToken,
                    data: {
                        user: saved as IUser,
                    },
                },
                201
            );
        } catch (error: any) {
            logger.error('Unexpected error in AuthController.register', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'REGISTRATION_FAILED',
                        message: 'Failed to register user',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * Login user
     */
    static async login(c: AppContext): Promise<Response> {
        try {
            // @ts-ignore
            const valid: LoginInput = c.req.valid('json');

            const info: ConnInfo = getConnInfo(c);
            const userAgent = c.req.header('User-Agent');
            const data = {
                ...valid,
                ...info,
                userAgent,
            };

            const user = await authRepository.findUserByEmail(valid.email.toLowerCase(), true);

            if (!user || !user.isActive) {
                return c.json<IErrorResponse>({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found or inactive',
                        requestId: c.get('requestId'),
                    },
                });
            }

            // Verify password
            const isPasswordValid = await authRepository.comparePassword(
                (user as any).id,
                data.password
            );

            if (!isPasswordValid) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'INVALID_CREDENTIALS',
                            message: 'Invalid email or password',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }
            // Always require 2FA
            const user2FA = await authRepository.findEnabledUser2FA((user as any).id);
            const method = user2FA?.method || 'email';
            const tempToken = await OTPService.generateTemp2FAToken((user as any).id);

            if (method === 'email') {
                await OTPService.generateAndSendEmailOTP(
                    (user as any).id,
                    user.email as string,
                    '2fa_login'
                );
            }

            return c.json<AuthResponse>(
                {
                    success: true,
                    message: '2-step verification required',
                    pending_2fa: true,
                    method: method as any,
                    temp_token: tempToken,
                    data: {
                        user: user as IUser,
                    },
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in AuthController.login', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'LOGIN_FAILED',
                        message: 'Failed to authenticate user',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * Login with google
     */
    static async google(c: AppContext): Promise<Response> {
        try {
            // @ts-ignore
            const valid: GoogleLoginInput = c.req.valid('json');

            let payload: TokenPayload | undefined;
            if (valid.code) {
                payload = await GoogleAuthConfig.exchangeCode(valid.code);
            } else if (valid.token) {
                payload = await GoogleAuthConfig.verifyIdToken(valid.token);
            }

            if (!payload) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'INVALID_GOOGLE_TOKEN',
                            message: 'Invalid Google token or code',
                            requestId: c.get('requestId'),
                        },
                    },
                    400
                );
            }

            return await AuthController._handleGoogleLogin(c, payload);
        } catch (error: any) {
            logger.error('Unexpected error in AuthController.google', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'LOGIN_FAILED',
                        message: 'Failed to authenticate user with Google',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    private static async _handleGoogleLogin(
        c: AppContext,
        payload: TokenPayload
    ): Promise<Response> {
        const info: ConnInfo = getConnInfo(c);
        const userAgent = c.req.header('User-Agent');

        if (!payload.email) {
            return c.json<IErrorResponse>({
                success: false,
                error: {
                    code: 'GOOGLE_NO_EMAIL',
                    message: 'Google token did not provide an email',
                    requestId: c.get('requestId'),
                },
            });
        }

        let user = await authRepository.findUserByEmail(payload.email.toLowerCase());

        if (!user) {
            // Create new user if they don't exist
            user = await authRepository.createUser({
                email: payload.email.toLowerCase(),
                firstName: payload.given_name,
                lastName: payload.family_name,
                avatar: payload.picture,
                googleId: payload.sub,
                emailVerified: true,
            });

            await authRepository.createUserPreference({
                userId: unprefixId((user as any).id),
                notification: {
                    sourceFailures: true,
                    dailySummary: true,
                    securityAlerts: true,
                    weeklyReports: true,
                    preferences: {
                        emailFrequency: 'immediate',
                        quietHours: '22:00-08:00',
                    },
                },
            });
        } else {
            // Link Google ID to existing user
            if (!user.googleId) {
                await profileRepository.updateUser((user as any).id, { googleId: payload.sub });
            }
        }
        const appPayload = {
            userId: (user as any).id.toString(),
            email: user.email.toString(),
        };

        // Always require 2FA
        const user2FA = await authRepository.findEnabledUser2FA((user as any).id);
        const method = user2FA?.method || 'email';
        const tempToken = await OTPService.generateTemp2FAToken((user as any).id);

        if (method === 'email') {
            await OTPService.generateAndSendEmailOTP(
                (user as any).id,
                user.email as string,
                '2fa_login'
            );
        }

        return c.json<AuthResponse>(
            {
                success: true,
                message: '2-step verification required',
                pending_2fa: true,
                method: method as any,
                temp_token: tempToken,
                data: {
                    user: user as IUser,
                },
            },
            200
        );
    }

    /**
     * Refresh access token
     */
    static async refreshToken(c: AppContext): Promise<Response> {
        try {
            let refresh = await getSignedCookie(c, config.jwt.secrets.refresh, 'refresh_token');

            // Fallback to request body if cookie is missing
            if (!refresh) {
                try {
                    const body = await c.req.json();
                    refresh = body.refreshToken;
                } catch (e) {
                    // Ignore body parse errors if cookie was already checked
                }
            }

            if (typeof refresh !== 'string' || !refresh) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'INVALID_TOKEN',
                            message: 'Refresh token is missing',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }

            const payload = authUtils.verifyRefreshToken(refresh);
            const session = await authRepository.findRefreshTokenByToken(refresh);
            if (!session) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'INVALID_TOKEN',
                            message: 'Invalid or revoked refresh token',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }

            const user = await profileRepository.findUserById(payload.userId);
            if (!user || !(user as any).isActive) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'USER_NOT_FOUND',
                            message: 'User associated with this token not found',
                            requestId: c.get('requestId'),
                        },
                    },
                    403
                );
            }

            // Revoke current token
            await authRepository.revokeRefreshToken(refresh);

            // Generate new token pair
            const tokens = authUtils.generateTokenPair({
                userId: (user as any).id.toString(),
                email: user.email.toString(),
            });

            // Store new refresh token
            try {
                await authRepository.createRefreshToken({
                    userId: unprefixId((user as any).id),
                    token: tokens.refresh,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                    ipAddress: (session as any).ipAddress,
                    userAgent: (session as any).userAgent,
                });
            } catch (err: unknown) {
                logger.error('Failed to store refresh token in MongoDB', err);
            }

            await setSignedCookie(c, 'access_token', tokens.access, config.jwt.secrets.access, {
                domain: config.app.frontendUrl.split('/')[2],
                path: '/',
                secure: config.isProduction,
                httpOnly: true,
                sameSite: 'Lax',
            });
            await setSignedCookie(c, 'refresh_token', tokens.refresh, config.jwt.secrets.refresh, {
                domain: config.app.frontendUrl.split('/')[2],
                path: '/',
                secure: config.isProduction,
                httpOnly: true,
                sameSite: 'Lax',
            });

            return c.json<AuthRefreshResponse>(
                {
                    success: true,
                    message: 'Token refreshed successfully',
                    data: {
                        tokens: {
                            access: tokens.access,
                            refresh: tokens.refresh,
                        },
                    },
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in AuthController.refreshToken', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'TOKEN_REFRESH_FAILED',
                        message: 'Failed to refresh token',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * Logout user
     */
    static async logout(c: AppContext): Promise<Response> {
        try {
            const refresh = await getSignedCookie(c, config.jwt.secrets.refresh, 'refresh_token');

            if (typeof refresh !== 'string') {
                return c.json<AuthActionsResponse>(
                    {
                        success: true,
                        message: 'Logout successful',
                    },
                    200
                );
            }

            const session = await authRepository.findRefreshTokenByToken(refresh);
            if (!session) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'SESSION_NOT_FOUND',
                            message: 'Session not found',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            await authRepository.revokeRefreshToken(refresh);

            deleteCookie(c, 'access_token');
            deleteCookie(c, 'refresh_token');

            return c.json<AuthActionsResponse>(
                {
                    success: true,
                    message: 'Logout successful',
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in AuthController.logout', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'LOGOUT_FAILED',
                        message: 'Failed to logout',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * Change password
     */
    static async changePassword(c: AppContext): Promise<Response> {
        try {
            const userId = c.user?.userId;
            if (!userId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED',
                            message: 'Authentication required',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }

            // @ts-ignore
            const valid: ChangePasswordInput = c.req.valid('json');
            const user = await profileRepository.findUserById(userId);

            if (!user || !(user as any).isActive) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'USER_NOT_FOUND',
                            message: 'User not found or inactive',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            const isCurrentPasswordValid = await authRepository.comparePassword(
                userId,
                valid.currentPassword
            );

            if (!isCurrentPasswordValid) {
                return c.json<IErrorResponse>({
                    success: false,
                    error: {
                        code: 'INVALID_CURRENT_PASSWORD',
                        message: 'Current password is incorrect',
                        requestId: c.get('requestId'),
                    },
                });
            }

            await authRepository.updatePassword(userId, valid.newPassword);

            return c.json<AuthActionsResponse>(
                {
                    success: true,
                    message: 'Password changed successfully',
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in AuthController.changePassword', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'CHANGE_PASSWORD_FAILED',
                        message: 'Failed to change password',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * Forgot password - send reset email
     */
    static async forgotPassword(c: AppContext): Promise<Response> {
        try {
            // @ts-ignore
            const valid: ForgotPasswordInput = c.req.valid('json');
            const user = await authRepository.findUserByEmail(valid.email);

            if (!user || !(user as any).isActive) {
                return c.json<AuthActionsResponse>(
                    {
                        success: true,
                        message:
                            'If an account with this email exists and not inactive, a password reset link has been sent.',
                    },
                    200
                );
            }

            const payload = {
                userId: (user as any).id.toString(),
                email: user.email.toString(),
            };
            const token = authUtils.generateResetToken(payload);

            try {
                const resetUrl = `${config.app.frontendUrl}/auth/reset-password?token=${token}`;
                const body = renderPasswordResetEmail({
                    firstName: user.firstName,
                    email: user.email,
                    resetUrl,
                    brandName: config.app.name,
                    supportEmail: config.contacts.support,
                });
                await mailQueues.sendMailHighPriorityQueue.add('high-priority-mail', {
                    to: user.email as string,
                    subject: `Verify your ${config.app.name} email address`,
                    html: body,
                });
            } catch (mailError: any) {
                logger.error(
                    'Unexpected error on sending reset password link in AuthController.forgotPassword',
                    mailError
                );
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'SEND_RESET_PASSWORD_FAILED',
                            message: 'Failed to send reset password link',
                            requestId: c.get('requestId'),
                        },
                    },
                    500
                );
            }

            return c.json<AuthActionsResponse>(
                {
                    success: true,
                    message:
                        'If an account with this email exists and not inactive, a password reset link has been sent.',
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in AuthController.forgotPassword', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'FORGOT_PASSWORD_FAILED',
                        message: 'Failed to process password reset request',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * Reset password
     */
    static async resetPassword(c: AppContext): Promise<Response> {
        try {
            // @ts-ignore
            const valid: ResetPasswordInput = c.req.valid('json');

            const decoded = authUtils.verifyResetToken(valid.token);

            if (decoded.type !== 'password_reset') {
                return c.json<IErrorResponse>({
                    success: false,
                    error: {
                        code: 'INVALID_TOKEN',
                        message: 'Invalid reset token',
                        requestId: c.get('requestId'),
                    },
                });
            }

            const user = await profileRepository.findUserById(decoded.userId);

            if (!user || !(user as any).isActive) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'USER_NOT_FOUND',
                            message: 'User not found or inactive',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            await authRepository.updatePassword((user as any).id, valid.password);

            return c.json<AuthActionsResponse>(
                {
                    success: true,
                    message: 'Password reset successful',
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in AuthController.forgotPassword', error);
            return c.json(
                {
                    success: false,
                    error: {
                        code: 'RESET_PASSWORD_FAILED',
                        message: 'Failed to reset password',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * Verify email
     */
    static async verifyEmail(c: AppContext): Promise<Response> {
        try {
            // @ts-ignore
            const valid: VerifyEmailInput = c.req.valid('json');

            const user = await authRepository.findUserByVerificationToken(valid.token);

            if (!user || !(user as any).isActive) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'INVALID_TOKEN',
                            message: 'Invalid or expired verification token',
                            requestId: c.get('requestId'),
                        },
                    },
                    400
                );
            }

            if (user.emailVerified) {
                return c.json<IErrorResponse>({
                    success: false,
                    error: {
                        code: 'EMAIL_ALREADY_VERIFIED',
                        message: 'Email is already verified',
                        requestId: c.get('requestId'),
                    },
                });
            }

            await authRepository.verifyUserEmail((user as any).id);

            return c.json<AuthActionsResponse>(
                {
                    success: true,
                    message: 'Email verified successfully',
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in AuthController.verifyEmail', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'VERIFY_EMAIL_FAILED',
                        message: 'Failed to verify email',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * Get email verification status
     */
    static async getEmailVerificationStatus(c: AppContext): Promise<Response> {
        try {
            const userId = c.user?.userId;
            if (!userId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED',
                            message: 'Authentication required',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }

            const user = await profileRepository.findUserById(userId);

            if (!user || !(user as any).isActive) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'USER_NOT_FOUND',
                            message: 'User not found or inactive',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            return c.json(
                {
                    success: true,
                    data: {
                        emailVerified: user.emailVerified,
                    },
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in AuthController.getEmailVerificationStatus', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'VERIFICATION_STATUS_FAILED',
                        message: 'Failed to fetch verification status',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * Resend verification email
     */
    static async resendEmailVerification(c: AppContext): Promise<Response> {
        try {
            const userId = c.user?.userId;
            if (!userId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED',
                            message: 'Authentication required',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }

            const user = await profileRepository.findUserById(userId);

            if (!user || !(user as any).isActive) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'USER_NOT_FOUND',
                            message: 'User not found or inactive',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            if (user.emailVerified) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'EMAIL_ALREADY_VERIFIED',
                            message: 'Email is already verified',
                            requestId: c.get('requestId'),
                        },
                    },
                    400
                );
            }

            const token = crypto.randomUUID();
            await authRepository.updateVerificationToken((user as any).id, token);

            try {
                const verificationUrl = `${config.app.frontendUrl}/auth/verify-email/${token}`;

                const body = renderEmailVerificationEmail({
                    firstName: user.firstName as string,
                    email: user.email as string,
                    verificationUrl,
                    brandName: config.app.name,
                    supportEmail: config.contacts.support,
                });

                await mailQueues.sendMailHighPriorityQueue.add(
                    mailQueuesName.sendMailHighPriorityQueueName,
                    {
                        to: user.email as string,
                        subject: `Verify your ${config.app.name} email address`,
                        html: body,
                    }
                );
            } catch (mailError: any) {
                logger.error(
                    'Unexpected error on sending verification mail in AuthController.resendEmailVerification',
                    mailError
                );
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'SEND_VERIFICATION_FAILED',
                            message: 'Failed to send verification mail',
                            requestId: c.get('requestId'),
                        },
                    },
                    500
                );
            }

            return c.json<AuthActionsResponse>(
                {
                    success: true,
                    message: 'Verification email resent successfully',
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in AuthController.resendEmailVerification', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'RESEND_VERIFICATION_FAILED',
                        message: 'Failed to resend verification email',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * Setup 2FA
     */
    static async setup2FA(c: AppContext): Promise<Response> {
        try {
            const userId = c.user?.userId;
            // @ts-ignore
            const data: Setup2FAInput = c.req.valid('json');

            if (!userId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED',
                            message: 'Unauthorized',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }

            const user = await profileRepository.findUserById(userId);
            if (!user) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'USER_NOT_FOUND',
                            message: 'User not found',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            if (data.method === 'app') {
                const { secret, qrCode } = await OTPService.generateTOTPSetup(userId, user.email);

                await authRepository.upsertUser2FA(userId, {
                    method: 'app',
                    secret,
                    isEnabled: false,
                });

                return c.json({
                    success: true,
                    data: {
                        secret,
                        qrCode,
                    },
                });
            } else {
                await authRepository.upsertUser2FA(userId, {
                    method: 'email',
                    isEnabled: false,
                });

                await OTPService.generateAndSendEmailOTP(userId, user.email, '2fa_setup');

                return c.json({
                    success: true,
                    message: 'OTP sent to your email',
                });
            }
        } catch (error: any) {
            logger.error('Error in setup2FA', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'SETUP_2FA_FAILED',
                        message: 'Failed to setup 2FA',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * Verify 2FA Setup
     */
    static async verify2FASetup(c: AppContext): Promise<Response> {
        try {
            const userId = c.user?.userId;
            const data: Verify2FASetupInput = await c.req.json();

            if (!userId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED',
                            message: 'Unauthorized',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }

            const user2FA = await authRepository.findUser2FA(userId, true);
            if (!user2FA) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'NOT_FOUND',
                            message: '2FA setup not found',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            let isValid = false;
            if (user2FA.method === 'app') {
                isValid = await OTPService.verifyTOTP(data.code, user2FA.secret);
            } else {
                isValid = await OTPService.verifyEmailOTP(userId, '2fa_setup', data.code);
            }

            if (!isValid) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'INVALID_CODE',
                            message: 'Invalid verification code',
                            requestId: c.get('requestId'),
                        },
                    },
                    400
                );
            }

            await user2FA.enable();

            // Generate backup codes if none exist or to ensure fresh ones during setup
            const backupCodes = user2FA.generateBackupCodes();
            await user2FA.save();

            return c.json({
                success: true,
                message: '2FA enabled successfully',
                data: {
                    backupCodes,
                },
            });
        } catch (error: any) {
            logger.error('Error in verify2FASetup', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'VERIFY_2FA_SETUP_FAILED',
                        message: 'Failed to verify 2FA setup',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * Disable 2FA
     */
    static async disable2FA(c: AppContext): Promise<Response> {
        try {
            const userId = c.user?.userId;

            if (!userId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED',
                            message: 'Unauthorized',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }

            const user2FA = await authRepository.findUser2FA(userId);
            if (!user2FA) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'NOT_FOUND',
                            message: '2FA settings not found',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            await user2FA.disable();

            return c.json({
                success: true,
                message: '2FA disabled successfully',
            });
        } catch (error: any) {
            logger.error('Error in disable2FA', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'DISABLE_2FA_FAILED',
                        message: 'Failed to disable 2FA',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * Login with 2FA
     */
    static async login2FA(c: AppContext): Promise<Response> {
        try {
            const data: Login2FAInput = await c.req.json();
            const userId = await OTPService.getUserIdFromTempToken(data.tempToken);

            if (!userId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'INVALID_TEMP_TOKEN',
                            message: 'Temporary token expired or invalid',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }

            const user = await profileRepository.findUserById(userId);
            const user2FA = await authRepository.findEnabledUser2FA(userId, true);

            if (!user) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'USER_NOT_FOUND',
                            message: 'User not found',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            let isValid = false;
            if (user2FA && user2FA.method === 'app') {
                isValid = await OTPService.verifyTOTP(data.code, user2FA.secret);
            } else {
                // Default to email verification if no explicit 2FA setup
                isValid = await OTPService.verifyEmailOTP(userId, '2fa_login', data.code);
            }

            if (!isValid) {
                // Check backup code only if user2FA exists
                const isBackupCode = user2FA ? await user2FA.useBackupCode(data.code) : false;
                if (!isBackupCode) {
                    return c.json<IErrorResponse>(
                        {
                            success: false,
                            error: {
                                code: 'INVALID_CODE',
                                message: 'Invalid verification code',
                                requestId: c.get('requestId'),
                            },
                        },
                        401
                    );
                }
            }

            const info: ConnInfo = getConnInfo(c);
            const userAgent = c.req.header('User-Agent');

            const payload = {
                userId: (user as any).id.toString(),
                email: user.email.toString(),
            };
            const tokens = authUtils.generateTokenPair(payload);

            try {
                await authRepository.createRefreshToken({
                    userId: unprefixId((user as any).id),
                    token: tokens.refresh,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                    ipAddress: info.remote.address as string,
                    userAgent: userAgent,
                });
            } catch (err: unknown) {
                logger.error('Failed to store refresh token in MongoDB', err);
            }

            await authRepository.updateLastLogin((user as any).id);
            await OTPService.invalidateTempToken(data.tempToken);

            await setSignedCookie(c, 'access_token', tokens.access, config.jwt.secrets.access, {
                domain: config.app.frontendUrl.split('/')[2],
                path: '/',
                secure: config.isProduction,
                httpOnly: true,
                sameSite: 'Lax',
            });
            await setSignedCookie(c, 'refresh_token', tokens.refresh, config.jwt.secrets.refresh, {
                domain: config.app.frontendUrl.split('/')[2],
                path: '/',
                secure: config.isProduction,
                httpOnly: true,
                sameSite: 'Lax',
            });

            return c.json<AuthResponse>(
                {
                    success: true,
                    message: 'Login successful',
                    data: {
                        user: user as IUser,
                        tokens: {
                            access: tokens.access,
                            refresh: tokens.refresh,
                        },
                    },
                },
                200
            );
        } catch (error: any) {
            logger.error('Error in login2FA', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'LOGIN_2FA_FAILED',
                        message: 'Failed to login with 2FA',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * Resend 2FA OTP
     */
    static async resend2FAOTP(c: AppContext): Promise<Response> {
        try {
            const data: { tempToken: string } = await c.req.json();
            const userId = await OTPService.getUserIdFromTempToken(data.tempToken);

            if (!userId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'INVALID_TEMP_TOKEN',
                            message: 'Temporary token expired or invalid',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }

            const user = await profileRepository.findUserById(userId);
            const user2FA = await authRepository.findEnabledUser2FA(userId, true);

            if (!user) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'USER_NOT_FOUND',
                            message: 'User not found',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            const method = user2FA?.method || 'email';

            if (method !== 'email') {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'INVALID_METHOD',
                            message: 'OTP resend is only available for email verification',
                            requestId: c.get('requestId'),
                        },
                    },
                    400
                );
            }

            await OTPService.generateAndSendEmailOTP(userId, user.email as string, '2fa_login');

            return c.json({
                success: true,
                message: 'Verification code resent to your email',
            });
        } catch (error: any) {
            logger.error('Error in resend2FAOTP', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'RESEND_OTP_FAILED',
                        message: 'Failed to resend verification code',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * Request OTP for sensitive action
     */
    static async requestSensitiveOTP(c: AppContext): Promise<Response> {
        try {
            const userId = c.user?.userId;
            const data: RequestSensitiveOTPInput = await c.req.json();

            if (!userId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED',
                            message: 'Unauthorized',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }

            const user = await profileRepository.findUserById(userId);
            const user2FA = await authRepository.findEnabledUser2FA(userId, true);

            if (!user) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'USER_NOT_FOUND',
                            message: 'User not found',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            if (user2FA && user2FA.method === 'app') {
                return c.json({
                    success: true,
                    message: 'Please use your authenticator app code',
                    data: { method: 'app' },
                });
            } else {
                await OTPService.generateAndSendEmailOTP(
                    userId,
                    user.email,
                    `sensitive:${data.action}`
                );
                return c.json({
                    success: true,
                    message: 'OTP sent to your email',
                    data: { method: 'email' },
                });
            }
        } catch (error: any) {
            logger.error('Error in requestSensitiveOTP', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'REQUEST_OTP_FAILED',
                        message: 'Failed to request OTP',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * Verify OTP for sensitive action
     */
    static async verifySensitiveOTP(c: AppContext): Promise<Response> {
        try {
            const userId = c.user?.userId;
            const data: VerifySensitiveOTPInput = await c.req.json();

            if (!userId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED',
                            message: 'Unauthorized',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }

            const user2FA = await authRepository.findEnabledUser2FA(userId, true);

            let isValid = false;
            if (user2FA && user2FA.method === 'app') {
                isValid = await OTPService.verifyTOTP(data.code, user2FA.secret);
            } else {
                isValid = await OTPService.verifyEmailOTP(
                    userId,
                    `sensitive:${data.action}`,
                    data.code
                );
            }

            if (!isValid) {
                if (user2FA && user2FA.method === 'app') {
                    isValid = await user2FA.useBackupCode(data.code);
                }
            }

            if (!isValid) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'INVALID_CODE',
                            message: 'Invalid verification code',
                            requestId: c.get('requestId'),
                        },
                    },
                    400
                );
            }

            await OTPService.markActionAsVerified(userId, data.action);

            return c.json({
                success: true,
                message: 'Action verified successfully',
            });
        } catch (error: any) {
            logger.error('Error in verifySensitiveOTP', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'VERIFY_OTP_FAILED',
                        message: 'Failed to verify OTP',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
}
