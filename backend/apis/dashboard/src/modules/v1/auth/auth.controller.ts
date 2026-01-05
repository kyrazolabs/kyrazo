import { TokenPayload } from 'google-auth-library';
import { getConnInfo } from 'hono/bun';
import { ConnInfo } from 'hono/conninfo';
import { deleteCookie, setSignedCookie, getSignedCookie } from 'hono/cookie';
import { config, logger } from '@/configs';
import {
    AuthActionsResponse,
    AuthRefreshResponse,
    AuthResponse,
    IErrorResponse,
    IUser,
    ProfileActionsResponse,
    RefreshToken,
    User,
    PreferencesActionsResponse,
} from '@kyrazo/shared';
import {
    ChangePasswordInput,
    ForgotPasswordInput,
    GoogleLoginInput,
    LoginInput,
    RefreshTokenInput,
    RegisterInput,
    ResetPasswordInput,
    UpdatePreferencesInput,
    UpdateProfileInput,
    VerifyEmailInput,
} from './auth.schema';
import {
    renderEmailVerificationEmail,
    renderPasswordResetEmail,
} from '@/templates/emails';
import { mailQueues } from '@/producers/jobs/v1/publishers';
import { UserPreference } from '@kyrazo/shared';
import { authUtils } from '@/core/utils/libs/jwt';
import { AppContext } from '@/core/middlewares/auth.middleware';
import GoogleAuthConfig from '@/configs/google';

export class AuthController {
    /**
     * Register a new user
     */
    static async register(c: AppContext): Promise<Response> {
        try {
            const valid: RegisterInput = c.req.valid('json');
            const info: ConnInfo = getConnInfo(c);
            const userAgent = c.req.header('User-Agent');

            const existingUserByEmail = await User.findOne({
                email: valid.email.toLowerCase(),
            });

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
            };
            // Create new user with hashed password
            const user = new User(data);

            const saved = await user.save();
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

            const preference = new UserPreference({
                userId: saved._id,
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

            await preference.save();

            try {
                const verificationUrl = `${config.app.frontendUrl}/verify-email?token=${saved.emailVerificationToken}`;

                const body = renderEmailVerificationEmail({
                    firstName: saved.firstName as string,
                    email: saved.email as string,
                    verificationUrl,
                    brandName: config.app.name,
                    supportEmail: config.contacts.support,
                });

                await mailQueues.sendMailHighPriorityQueue.add(
                    'high-priority-mail',
                    {
                        to: saved.email as string,
                        subject: `Verify your ${config.app.name} email address`,
                        html: body,
                    }
                );
            } catch (mailError: unknown) {
                logger.error(
                    'Unexpected error on sending verification mail in AuthController.register',
                    mailError as Error
                );
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'SEND_VERIFICATION_FAILED',
                            message: 'Failed to send verification mail',
                            details: mailError,
                            requestId: c.get('requestId'),
                        },
                    },
                    500
                );
            }

            const payload = {
                userId: saved._id.toString(),
                email: saved.email.toString(),
            };
            const tokens = authUtils.generateTokenPair(payload);

            try {
                const refreshTokenDoc = new RefreshToken({
                    userId: user._id,
                    token: tokens.refresh,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                    ipAddress: data.remote.address as string,
                    userAgent: data.userAgent,
                });
                await refreshTokenDoc.save();
            } catch (err: unknown) {
                logger.error(
                    'Failed to store refresh token in MongoDB',
                    err as Error
                );
            }
            await setSignedCookie(
                c,
                'access_token',
                tokens.access,
                config.jwt.secrets.key,
                {
                    path: '/',
                    secure: true,
                    domain: config.app.frontendUrl,
                }
            );
            await setSignedCookie(
                c,
                'refresh_token',
                tokens.refresh,
                config.jwt.secrets.key,
                {
                    path: '/',
                    secure: true,
                    domain: config.app.frontendUrl,
                }
            );
            return c.json<AuthResponse>(
                {
                    success: true,
                    message:
                        'User registered successfully. Please check your email to verify your account.',
                    data: {
                        user: saved as IUser,
                        tokens: {
                            access: tokens.access,
                            refresh: tokens.refresh,
                        },
                    },
                },
                201
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in AuthController.register',
                error as Error
            );
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
            const valid: LoginInput = c.req.valid('json');

            const info: ConnInfo = getConnInfo(c);
            const userAgent = c.req.header('User-Agent');
            const data = {
                ...valid,
                ...info,
                userAgent,
            };

            const user = await User.findOne({
                email: valid.email.toLowerCase(),
            }).select('+passwordHash');

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
            const isPasswordValid = await user.comparePassword(data.password);

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

            const payload = {
                userId: user._id.toString(),
                email: user.email.toString(),
            };

            const tokens = authUtils.generateTokenPair(payload);

            try {
                const refreshTokenDoc = new RefreshToken({
                    userId: user._id,
                    token: tokens.refresh,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                    ipAddress: data.remote.address as string,
                    userAgent: data.userAgent,
                });
                await refreshTokenDoc.save();
            } catch (err: unknown) {
                logger.error(
                    'Failed to store refresh token in MongoDB',
                    err as Error
                );
            }

            await user.updateLastLogin();

            await setSignedCookie(
                c,
                'access_token',
                tokens.access,
                config.jwt.secrets.key,
                {
                    path: '/',
                    secure: true,
                    domain: config.app.frontendUrl,
                }
            );
            await setSignedCookie(
                c,
                'refresh_token',
                tokens.refresh,
                config.jwt.secrets.key,
                {
                    path: '/',
                    secure: true,
                    domain: config.app.frontendUrl,
                }
            );

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
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in AuthController.login',
                error as Error
            );
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
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in AuthController.google',
                error as Error
            );
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

        let user = await User.findOne({ email: payload.email.toLowerCase() });

        if (!user) {
            // Create new user if they don't exist
            const newUser = new User({
                email: payload.email.toLowerCase(),
                firstName: payload.given_name,
                lastName: payload.family_name,
                avatar: payload.picture,
                googleId: payload.sub,
                emailVerified: true,
            });
            user = await newUser.save();

            const preference = new UserPreference({
                userId: user._id,
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
            await preference.save();
        } else {
            // Link Google ID to existing user
            if (!user.googleId) {
                user.googleId = payload.sub;
                await user.save();
            }
        }

        const appPayload = {
            userId: user._id.toString(),
            email: user.email.toString(),
        };

        const tokens = authUtils.generateTokenPair(appPayload);

        try {
            const refreshTokenDoc = new RefreshToken({
                userId: user._id,
                token: tokens.refresh,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                ipAddress: info.remote.address as string,
                userAgent: userAgent,
            });
            await refreshTokenDoc.save();
        } catch (err: unknown) {
            logger.error(
                'Failed to store refresh token in MongoDB',
                err as Error
            );
        }

        await user.updateLastLogin();

        await setSignedCookie(
            c,
            'access_token',
            tokens.access,
            config.jwt.secrets.key,
            {
                path: '/',
                secure: true,
                domain: config.app.frontendUrl,
            }
        );
        await setSignedCookie(
            c,
            'refresh_token',
            tokens.refresh,
            config.jwt.secrets.key,
            {
                path: '/',
                secure: true,
                domain: config.app.frontendUrl,
            }
        );

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
    }

    /**
     * Refresh access token
     */
    static async refreshToken(c: AppContext): Promise<Response> {
        try {
            const { refreshToken }: RefreshTokenInput = c.req.valid('json');
            const payload = authUtils.verifyRefreshToken(refreshToken);

            const storedRefreshToken = await RefreshToken.findOne({
                userId: payload.userId,
                token: refreshToken,
                isRevoked: false, // Add this field to your RefreshToken model
                expiresAt: { $gt: new Date() },
            });

            if (!storedRefreshToken) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'INVALID_REFRESH_FAILED',
                            message: 'Invalid or revoked refresh token',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }

            const user = await User.findById(payload.userId);
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

            const tokens = authUtils.generateTokenPair({
                userId: user._id.toString(),
                email: user.email.toString(),
            });

            await storedRefreshToken.revokeToken();

            const newRefreshTokenDoc = new RefreshToken({
                userId: user._id,
                token: tokens.refresh,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                ipAddress: storedRefreshToken.ipAddress,
                userAgent: storedRefreshToken.userAgent,
            });
            await newRefreshTokenDoc.save();

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
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in AuthController.refreshToken',
                error as Error
            );
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
            const refresh = await getSignedCookie(
                c,
                config.jwt.secrets.refresh,
                'refresh_token'
            );

            const session = await RefreshToken.findByToken(refresh);
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

            await session.revokeToken();

            deleteCookie(c, 'access_token');
            deleteCookie(c, 'refresh_token');

            return c.json<AuthActionsResponse>(
                {
                    success: true,
                    message: 'Logout successful',
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in AuthController.logout',
                error as Error
            );
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
     * Get current user profile
     */
    static async getProfile(c: AppContext): Promise<Response> {
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

            const user = (await User.findById(userId)) as IUser;

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

            return c.json<ProfileActionsResponse>(
                {
                    success: true,
                    message: 'Here is your profile',
                    data: user,
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in AuthController.getProfile',
                error as Error
            );
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'PROFILE_FETCH_FAILED',
                        message: 'Failed to fetch user profile',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * Update user profile
     */
    static async updateProfile(c: AppContext): Promise<Response> {
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

            const valid: UpdateProfileInput = c.req.valid('json');

            const user = await User.findById(userId);
            if (!user || !user.isActive) {
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

            const update = await user.updateProfile(valid);

            if (!update) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UPDATE_PROFILE_FAILED',
                            message: 'Update profile failed',
                            requestId: c.get('requestId'),
                        },
                    },
                    400
                );
            }

            return c.json<ProfileActionsResponse>(
                {
                    success: true,
                    message: 'Profile updated successfully',
                    data: update as IUser,
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in AuthController.updateProfile',
                error as Error
            );
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'PROFILE_UPDATE_FAILED',
                        message: 'Failed to update profile',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * Get user preferences
     */
    static async getPreferences(c: AppContext): Promise<Response> {
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

            let preferences = await UserPreference.findOne({ userId });

            if (!preferences) {
                // Create default preferences
                preferences = new UserPreference({
                    userId,
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
                await preferences.save();
            }

            return c.json<PreferencesActionsResponse>(
                {
                    success: true,
                    message: 'Preferences retrieved successfully',
                    data: preferences,
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in AuthController.getPreferences',
                error as Error
            );
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'PREFERENCES_FETCH_FAILED',
                        message: 'Failed to fetch preferences',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * Update user preferences
     */
    static async updatePreferences(c: AppContext): Promise<Response> {
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

            const valid: UpdatePreferencesInput = c.req.valid('json');

            let preferences = await UserPreference.findOne({ userId });

            if (!preferences) {
                preferences = new UserPreference({
                    userId,
                    notification: {
                        sourceFailures: true,
                        dailySummary: true,
                        securityAlerts: true,
                        weeklyReports: true,
                        preferences: {
                            emailFrequency: 'daily',
                            quietHours: '22:00-08:00',
                        },
                    },
                });
            }

            if (valid.notification) {
                Object.assign(preferences.notification, valid.notification);
            }

            await preferences.save();

            return c.json<PreferencesActionsResponse>(
                {
                    success: true,
                    message: 'Preferences updated successfully',
                    data: preferences,
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in AuthController.updatePreferences',
                error as Error
            );
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'PREFERENCES_UPDATE_FAILED',
                        message: 'Failed to update preferences',
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

            const valid: ChangePasswordInput = c.req.valid('json');
            const user = await User.findById(userId).select('+passwordHash');

            if (!user || !user.isActive) {
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

            const isCurrentPasswordValid = await user.comparePassword(
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

            user.passwordHash = valid.newPassword;

            await user.save();

            return c.json<AuthActionsResponse>(
                {
                    success: true,
                    message: 'Password changed successfully',
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in AuthController.changePassword',
                error as Error
            );
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
            const valid: ForgotPasswordInput = c.req.valid('json');
            const user = await User.findOne(valid).select('+passwordHash');

            if (!user || !user.isActive) {
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
                userId: user._id.toString(),
                email: user.email.toString(),
            };
            const token = authUtils.generateResetToken(payload);

            try {
                const resetUrl = `${config.app.frontendUrl}/reset-password?token=${token}`;
                const body = renderPasswordResetEmail({
                    firstName: user.firstName,
                    email: user.email,
                    resetUrl,
                    brandName: config.app.name,
                    supportEmail: config.contacts.support,
                });
                await mailQueues.sendMailHighPriorityQueue.add(
                    'high-priority-mail',
                    {
                        to: user.email as string,
                        subject: `Verify your ${config.app.name} email address`,
                        html: body,
                    }
                );
            } catch (mailError: unknown) {
                logger.error(
                    'Unexpected error on sending reset password link in AuthController.forgotPassword',
                    mailError as Error
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
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in AuthController.forgotPassword',
                error as Error
            );
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

            const user = await User.findById(decoded.userId);

            if (!user || !user.isActive) {
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

            user.passwordHash = valid.password;
            await user.save();

            return c.json<AuthActionsResponse>(
                {
                    success: true,
                    message: 'Password reset successful',
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in AuthController.forgotPassword',
                error as Error
            );
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
            const valid: VerifyEmailInput = c.req.valid('json');

            const decoded = authUtils.verifyVerificationToken(valid.token);
            if (decoded.type !== 'email_verification') {
                return c.json<IErrorResponse>({
                    success: false,
                    error: {
                        code: 'INVALID_TOKEN',
                        message: 'Invalid verification token',
                        requestId: c.get('requestId'),
                    },
                });
            }

            const user = await User.findByEmail(decoded.email);

            if (!user || !user.isActive) {
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
                return c.json<IErrorResponse>({
                    success: false,
                    error: {
                        code: 'EMAIL_ALREADY_VERIFIED',
                        message: 'Email is already verified',
                        requestId: c.get('requestId'),
                    },
                });
            }

            await User.updateOne(
                { _id: user._id },
                {
                    $set: { emailVerified: true },
                    $unset: { emailVerificationToken: '' },
                }
            );

            return c.json<AuthActionsResponse>(
                {
                    success: true,
                    message: 'Email verified successfully',
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in AuthController.verifyEmail',
                error as Error
            );
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
}
