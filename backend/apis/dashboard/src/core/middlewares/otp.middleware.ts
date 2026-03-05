import { Next } from 'hono';
import { IErrorResponse, logger, User2FA, unprefixId } from '@kyrazo/shared';
import { AppContext } from './auth.middleware';
import { OTPService } from '@/shared/services/otp.service';

export type SensitiveAction =
    | 'update_profile'
    | 'delete_workspace'
    | 'update_workspace'
    | 'delete_project'
    | 'update_project'
    | 'manage_keys'
    | 'disable_2fa';

/**
 * Middleware to require a recently verified OTP for sensitive actions
 */
export const requireRecentOTP = (action: SensitiveAction) => {
    return async (c: AppContext, next: Next) => {
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

            // Check if user has recently verified an OTP for this action
            const isVerified = await OTPService.isActionRecentlyVerified(userId, action);

            if (!isVerified) {
                // Fetch user 2FA method to include in response
                const user2FA = await User2FA.findOne({
                    userId: unprefixId(userId),
                    isEnabled: true,
                });
                const method = user2FA?.method || 'email';

                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'OTP_REQUIRED',
                            message:
                                'A recently verified OTP is required for this sensitive action.',
                            details: { action, method },
                            requestId: c.get('requestId'),
                        },
                    },
                    403
                );
            }

            await next();
        } catch (error) {
            logger.error('Error in requireRecentOTP middleware', error as Error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'An internal error occurred during security check',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    };
};
