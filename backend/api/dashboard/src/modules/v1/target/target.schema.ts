import { z } from 'zod';

const objectIdSchema = z
    .string()
    .regex(/^([a-z]{3}_)?[0-9a-fA-F]{24}$/, 'Invalid ID format')
    .transform((val: string) => (val.includes('_') ? val.split('_')[1] : val));

export const CreateTargetSchema = z.object({
    name: z
        .string()
        .min(3, 'Name must be at least 3 characters')
        .max(100, 'Name must be at most 100 characters'),

    url: z.string().min(1, 'URL is required').url('Invalid URL format'),

    method: z.enum(['POST', 'PUT', 'PATCH']).default('POST'),

    description: z.string().max(500, 'Description must be at most 500 characters').optional(),

    enabled: z.boolean().default(true),

    config: z.object({
        timeout: z
            .number()
            .min(100, 'Timeout must be at least 100ms')
            .max(60000, 'Timeout must be at most 60000ms')
            .default(5000),
        retryCount: z
            .number()
            .min(0, 'Retry count cannot be negative')
            .max(10, 'Retry count must not exceed 10')
            .default(3),
        rateLimit: z
            .number()
            .min(1, 'Rate limit must be at least 1 request')
            .max(10000, 'Rate limit must be at most 10000 requests')
            .optional(),
        rateLimitDuration: z
            .number()
            .min(1, 'Rate limit duration most be at least 1s')
            .max(60 * 60, 'Rate limit duration must be at most 3600s')
            .default(1),
    }),

    customHeaders: z
        .record(
            z.string().min(1, 'Header key cannot be empty'),
            z.string().min(1, 'Header value cannot be empty')
        )
        .optional(),
});

export const UpdateTargetSchema = CreateTargetSchema.partial();
export const UpdateTargetStatusSchema = CreateTargetSchema.pick({
    enabled: true,
}).extend({ targetId: objectIdSchema });

export const SearchTargetSchema = z.object({
    q: z
        .string()
        .min(3, 'Query must be at least 3 characters')
        .max(100, 'Query must be at most 100 characters')
        .optional(),
    enabled: z.boolean().optional(),
    limit: z.coerce.number().min(1).max(100).default(10),
    page: z.coerce.number().min(1).default(1),
});

export const GetTargetByIdSchema = z.object({
    targetId: objectIdSchema,
});

export type CreateTargetInput = z.infer<typeof CreateTargetSchema>;
export type UpdateTargetInput = z.infer<typeof UpdateTargetSchema>;
export type UpdateTargetStatusInput = z.infer<typeof UpdateTargetStatusSchema>;
export type FilterTargetInput = z.infer<typeof SearchTargetSchema>;
export type GetTargetByIdInput = z.infer<typeof GetTargetByIdSchema>;
