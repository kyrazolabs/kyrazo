import z from 'zod';
import { RegisterSchema } from '../auth/auth.schema';

export const UpdateProfileSchema = RegisterSchema.omit({
    email: true,
    password: true,
}).partial().extend({
    avatar: z.string().optional(),
});

export const UpdatePreferencesSchema = z
    .object({
        notification: z.object({
            sourceFailures: z.boolean().optional(),
            dailySummary: z.boolean().optional(),
            securityAlerts: z.boolean().optional(),
            weeklyReports: z.boolean().optional(),
            preferences: z.object({
                emailFrequency: z.string().min(1, 'Email frequency is required'),
                quietHours: z.string().min(1, 'Quiet hours is required').optional(),
            }),
        }),
    })
    .partial();

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;
