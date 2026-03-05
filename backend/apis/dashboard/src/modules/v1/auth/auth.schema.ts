import { z } from 'zod';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

export const RegisterSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email format')
        .regex(emailRegex, 'Invalid email format'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
            passwordRegex,
            'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        ),
    firstName: z
        .string()
        .min(2, 'First name must be at least 2 characters')
        .max(100, 'First name must be at most 100 characters'),
    lastName: z
        .string()
        .min(2, 'Last name must be at least 2 characters')
        .max(100, 'Last name must be at most 100 characters'),
    avatar: z
        .string()
        .url('Avatar must be a valid URL')
        .default('https://avatar.iran.liara.run/public/boy'),
    jobTitle: z.string(),
    timeZone: z.string().default('UTC'),
    language: z.enum(['en', 'ar', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja']).default('en'),
});

export const LoginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email format')
        .regex(emailRegex, 'Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

export const GoogleLoginSchema = z
    .object({
        code: z.string().optional(),
        token: z.string().optional(),
    })
    .refine(data => data.code || data.token, {
        message: 'Either code or token is required',
        path: ['code', 'token'],
    });

export const RefreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const ForgotPasswordSchema = RegisterSchema.pick({ email: true });

export const ResetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
            passwordRegex,
            'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        ),
});

export const VerifyEmailSchema = z.object({
    token: z.string().min(1, 'Token is required'),
});

export const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
            passwordRegex,
            'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        ),
});

export const UpdateProfileSchema = RegisterSchema.omit({
    email: true,
    password: true,
}).partial();

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

export const Setup2FASchema = z.object({
    method: z.enum(['email', 'app']),
});

export const Verify2FASetupSchema = z.object({
    code: z.string().min(1, 'Verification code is required'),
});

export const Login2FASchema = z.object({
    code: z.string().min(1, 'Verification code is required'),
    tempToken: z.string().min(1, 'Temporary token is required'),
});

export const Resend2FAOTPSchema = z.object({
    tempToken: z.string().min(1, 'Temporary token is required'),
});

export const RequestSensitiveOTPSchema = z.object({
    action: z.enum([
        'update_profile',
        'delete_workspace',
        'update_workspace',
        'delete_namespace',
        'update_namespace',
        'manage_keys',
        'disable_2fa',
    ]),
});

export const VerifySensitiveOTPSchema = z.object({
    action: z.enum([
        'update_profile',
        'delete_workspace',
        'update_workspace',
        'delete_namespace',
        'update_namespace',
        'manage_keys',
        'disable_2fa',
    ]),
    code: z.string().min(1, 'Verification code is required'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type GoogleLoginInput = z.infer<typeof GoogleLoginSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;

export type Setup2FAInput = z.infer<typeof Setup2FASchema>;
export type Verify2FASetupInput = z.infer<typeof Verify2FASetupSchema>;
export type Login2FAInput = z.infer<typeof Login2FASchema>;
export type Resend2FAOTPInput = z.infer<typeof Resend2FAOTPSchema>;
export type RequestSensitiveOTPInput = z.infer<typeof RequestSensitiveOTPSchema>;
export type VerifySensitiveOTPInput = z.infer<typeof VerifySensitiveOTPSchema>;
