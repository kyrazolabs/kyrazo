import { AppContext } from '@/core/middlewares/auth.middleware';
import {
    IErrorResponse,
    IUser,
    logger,
    PreferencesActionsResponse,
    ProfileActionsResponse,
    unprefixId,
} from '@kyrazo/shared';
import { profileRepository } from './profile.repo';
import { authRepository } from '@/modules/v1/auth/auth.repo';

export class ProfileController {
    /**
     * Get current user profile
     */
    async getProfile(c: AppContext): Promise<Response> {
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
            const user2FA = await authRepository.findEnabledUser2FA(userId);

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

            return c.json({
                success: true,
                message: 'Here is your profile',
                data: {
                    ...user,
                    is2FAEnabled: !!user2FA,
                },
            });
        } catch (error: any) {
            logger.error('Unexpected error in AuthController.getProfile', error);
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
    async updateProfile(c: AppContext): Promise<Response> {
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
            const valid: UpdateProfileInput = c.req.valid('json');

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

            const update = await profileRepository.updateUser(userId, valid);

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
        } catch (error: any) {
            logger.error('Unexpected error in AuthController.updateProfile', error);
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
    async getPreferences(c: AppContext): Promise<Response> {
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

            let preferences = await profileRepository.getUserPreference(userId);

            if (!preferences) {
                // Create default preferences
                preferences = await profileRepository.createUserPreference({
                    userId: unprefixId(userId),
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
            }

            return c.json<PreferencesActionsResponse>(
                {
                    success: true,
                    message: 'Preferences retrieved successfully',
                    data: preferences,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in AuthController.getPreferences', error);
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
    async updatePreferences(c: AppContext): Promise<Response> {
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
            const valid: UpdatePreferencesInput = c.req.valid('json');

            let preferences = await profileRepository.getUserPreference(userId);

            if (!preferences) {
                preferences = await profileRepository.createUserPreference({
                    userId: unprefixId(userId),
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
                preferences = await profileRepository.updateUserPreference(userId, {
                    notification: {
                        ...preferences.notification,
                        ...valid.notification,
                    },
                });
            }

            return c.json<PreferencesActionsResponse>(
                {
                    success: true,
                    message: 'Preferences updated successfully',
                    data: preferences,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in AuthController.updatePreferences', error);
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
}

export const profileController = new ProfileController();
