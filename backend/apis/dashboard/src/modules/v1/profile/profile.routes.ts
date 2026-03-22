import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import { profileController } from '@/modules/v1/profile/profile.controller';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { requireRecentOTP } from '@/core/middlewares/otp.middleware';

import { UpdateProfileSchema, UpdatePreferencesSchema } from './profile.schema';
import {
    profileUpdateRateLimiter,
    preferencesReadRateLimiter,
    preferencesUpdateRateLimiter,
    profileReadRateLimiter,
} from './profile.ratelimiter';

const profile = new Hono();

profile.use(authenticate);

profile.get('/', profileReadRateLimiter, profileController.getProfile);
profile.patch(
    '/',
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
    profileController.updateProfile
);

profile.get('/preferences', preferencesReadRateLimiter, profileController.getPreferences);
profile.patch(
    '/preferences',
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
    profileController.updatePreferences
);

export default profile;
