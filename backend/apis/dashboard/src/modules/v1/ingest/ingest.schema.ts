import z from 'zod';

const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const GetIngestsEventsBySourceSchema = z.object({
    q: z
        .string()
        .min(3, 'Query must be at least 3 characters')
        .max(100, 'Query must be at most 100 characters')
        .optional(),
    limit: z.coerce.number().min(1).max(100).default(10),
    page: z.coerce.number().min(1).default(1),
});

export const GetIngestEventsSchema = z.object({
    q: z
        .string()
        .min(3, 'Query must be at least 3 characters')
        .max(100, 'Query must be at most 100 characters')
        .optional(),
    status: z.enum(['pending', 'failed', 'processed']).optional(),
    limit: z.coerce.number().min(1).max(100).default(10),
    page: z.coerce.number().min(1).default(1),
});

export const GetIngestsBySourceIdSchema = z.object({
    sourceId: objectIdSchema,
});

export type IFilterIngest = z.infer<typeof GetIngestEventsSchema>;
export type GetIngestsEventsBySourceInput = z.infer<
    typeof GetIngestsEventsBySourceSchema
>;
export type GetIngestsBySourceIdInput = z.infer<
    typeof GetIngestsBySourceIdSchema
>;
