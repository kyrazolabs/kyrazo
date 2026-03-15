import z from 'zod';
export enum TargetStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    DELIVERED = 'delivered',
    FAILED = 'failed',
    TIMEOUT = 'timeout',
    NETWORK_ERROR = 'network_error',
}

const objectIdSchema = z.string().regex(/^(([a-z]{2,4})_)?([0-9a-fA-F]{24})$/, 'Invalid ID format');

const base64IdSchema = z
    .string()
    .transform((val, ctx) => {
        try {
            return atob(val);
        } catch {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Invalid base64 format',
            });
            return z.NEVER;
        }
    })
    .pipe(objectIdSchema);

export const TargetQuerySchema = z.object({
    targetId: z.union([objectIdSchema, base64IdSchema]),
});

export const GetDeliveriesBySourceSchema = z.object({
    q: z
        .string()
        .min(3, 'Query must be at least 3 characters')
        .max(100, 'Query must be at most 100 characters')
        .optional(),
    limit: z.coerce.number().min(1).max(100).default(10),
    page: z.coerce.number().min(1).default(1),
});

export const GetReceivedEventsBySourceSchema = z.object({
    q: z
        .string()
        .min(3, 'Query must be at least 3 characters')
        .max(100, 'Query must be at most 100 characters')
        .optional(),
    limit: z.coerce.number().min(1).max(100).default(10),
    page: z.coerce.number().min(1).default(1),
});

export const GetDeliveriesSchema = z.object({
    q: z
        .string()
        .min(3, 'Query must be at least 3 characters')
        .max(100, 'Query must be at most 100 characters')
        .optional(),
    status: z
        .enum(['pending', 'processing', 'delivered', 'failed', 'timeout', 'network_error'])
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

export const OverviewFilterSchema = z.object({
    days: z.enum(['last7days', 'last30days', 'last90days', 'last180days', 'last360days']),
});
export const GetDeliveryByIdSchema = z.object({
    deliveryId: z.string().regex(/^del_[0-9]+$/),
});
export const GetDeliveriesBySourceIdSchema = z.object({
    sourceId: objectIdSchema,
});

export type IFilterDelivery = z.infer<typeof GetDeliveriesSchema>;
export type IFilterIngest = z.infer<typeof GetIngestEventsSchema>;
export type IFilterDeliveryBySource = z.infer<typeof GetDeliveriesBySourceSchema>;

export type GetDeliveryByIdInput = z.infer<typeof GetDeliveryByIdSchema>;
export type GetDeliveriesBySourceIdInput = z.infer<typeof GetDeliveriesBySourceIdSchema>;

export type GetDeliveriesByTargetInput = z.infer<typeof TargetQuerySchema>;
export type OverviewFilterInput = z.infer<typeof OverviewFilterSchema>;
