import z from 'zod';

export const endpointStatusEnum = z.enum(['active', 'inactive']);
// export const endpointMethodsEnum = z.enum([
//     'POST',
//     'PUT',
//     'PATCH',
//     'GET',
//     'DELETE',
// ]);
const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const CreateEndpointSchema = z.object({
    name: z
        .string()
        .min(3, 'Name must be at least 3 characters')
        .max(100, 'Name must be at most 100 characters'),

    status: endpointStatusEnum,

    url: z.string().min(1, 'URL is required').url('Invalid URL format'),

    // method: endpointMethodsEnum,

    description: z
        .string()
        .max(500, 'Description must be at most 500 characters')
        .optional(),

    enabled: z.boolean().default(true),

    config: z.object({
        timeout: z
            .number()
            .min(100, 'Timeout must be at least 100ms')
            .max(60000, 'Timeout must be at most 60000ms'),
        retryCount: z
            .number()
            .min(0, 'Retry count cannot be negative')
            .max(10, 'Retry count must not exceed 10'),
        rateLimit: z
            .number()
            .min(1, 'Rate limit must be at least 1 request')
            .max(10000, 'Rate limit must be at most 10000 requests')
            .optional(),
    }),

    customHeaders: z
        .record(
            z.string().min(1, 'Header key cannot be empty'),
            z.string().min(1, 'Header value cannot be empty')
        )
        .optional(),
});

export const UpdateEndpointSchema = CreateEndpointSchema.partial();
export const UpdateEndpointStatusSchema = CreateEndpointSchema.pick({
    status: true,
}).extend({ endpointId: objectIdSchema });
export const SearchEndpointSchema = z.object({
    q: z
        .string()
        .min(3, 'Query must be at least 3 characters')
        .max(100, 'Query must be at most 100 characters')
        .optional(),
    status: endpointStatusEnum.optional(),
    limit: z.coerce.number().min(1).max(100).default(10),
    page: z.coerce.number().min(1).default(1),
});

export const GetEndpointByIdSchema = z.object({
    endpointId: objectIdSchema,
});

export type CreateEndpointInput = z.infer<typeof CreateEndpointSchema>;
export type UpdateEndpointInput = z.infer<typeof UpdateEndpointSchema>;
export type UpdateEndpointStatusInput = z.infer<
    typeof UpdateEndpointStatusSchema
>;
export type FilterEndpointInput = z.infer<typeof SearchEndpointSchema>;
export type GetEndpointByIdInput = z.infer<typeof GetEndpointByIdSchema>;
