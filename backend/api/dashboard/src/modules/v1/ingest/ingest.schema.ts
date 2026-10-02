import z from 'zod';

const objectIdSchema = z
    .string()
    .regex(/^([a-z]{2}_)?[0-9a-fA-F]{24}$/, 'Invalid ID format')
    .transform((val: string) => (val.includes('_') ? val.split('_')[1] : val));

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

export const GetIngestsByEventIdSchema = z.object({
    eventId: objectIdSchema,
});
export type IFilterIngest = z.infer<typeof GetIngestEventsSchema>;
export type GetIngestsEventsBySourceInput = z.infer<typeof GetIngestsEventsBySourceSchema>;
export type GetIngestsBySourceIdInput = z.infer<typeof GetIngestsBySourceIdSchema>;
export type GetIngestsByEventIdInput = z.infer<typeof GetIngestsByEventIdSchema>;
