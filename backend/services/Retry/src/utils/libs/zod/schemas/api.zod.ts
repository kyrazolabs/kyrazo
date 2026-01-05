import z from 'zod';

const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const createAPIKeySchema = z.object({
    name: z
        .string()
        .min(3, 'Name must be at least 3 characters')
        .max(100, 'Name must be at most 100 characters'),

    scopes: z.enum(
        [
            'events:publish',
            'events:subscribe',
            'events:read',
            'events:manage',
            'keys:manage',
            'users:manage',
        ],
        { error: () => ({ message: 'Invalid scope' }) }
    ),

    expiresAt: z
        .union([z.string().datetime(), z.number().int().positive(), z.date()])
        .optional()
        .transform(val => {
            if (!val) return null;
            if (val instanceof Date) return val;
            if (typeof val === 'string') return new Date(val);
            if (typeof val === 'number') return new Date(val);
            return null;
        })
        .refine(date => date === null || date > new Date(), {
            message: 'Expiration date must be in the future',
        }),
});

export const getKeysSchema = z.object({
    q: z
        .string()
        .min(3, 'Query must be at least 3 characters')
        .max(100, 'Query must be at most 100 characters')
        .optional(),
    limit: z.coerce.number().min(1).max(100).default(10),
    page: z.coerce.number().min(1).default(1),
});

export const checkScopeSchema = z.object({
    keyId: objectIdSchema,
});

export const revokeKeyById = z.object({
    keyId: objectIdSchema,
});

export type ICreateKey = z.infer<typeof createAPIKeySchema>;
export type ICheckScopes = z.infer<typeof checkScopeSchema>;
export type IRevokeKey = z.infer<typeof revokeKeyById>;
export type IGetKey = z.infer<typeof getKeysSchema>;
