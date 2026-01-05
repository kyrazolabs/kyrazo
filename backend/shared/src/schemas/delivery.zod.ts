import z from 'zod';
const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const TargetQuerySchema = z.object({
    target: z
        .string()
        .min(1)
        .refine(encoded => {
            try {
                const base64 = decodeURIComponent(encoded);
                // Check Base64 structure only (لا تفك الداتا هنا)
                return /^[A-Za-z0-9+/=]+$/.test(base64);
            } catch {
                return false;
            }
        }, 'Invalid encoded target'),
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
        .enum([
            'pending',
            'processing',
            'delivered',
            'failed',
            'timeout',
            'network_error',
        ])
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
    days: z.enum([
        'last7days',
        'last30days',
        'last90days',
        'last180days',
        'last360days',
    ]),
});
export const GetDeliveryByIdSchema = z.object({
    deliveryId: z.string().uuidv4(),
});
export const GetDeliveriesBySourceIdSchema = z.object({
    sourceId: objectIdSchema,
});

export type IFilterDelivery = z.infer<typeof GetDeliveriesSchema>;
export type IFilterIngest = z.infer<typeof GetIngestEventsSchema>;
export type IFilterDeliveryBySource = z.infer<
    typeof GetDeliveriesBySourceSchema
>;

export type GetDeliveryByIdInput = z.infer<typeof GetDeliveryByIdSchema>;
export type GetDeliveriesBySourceIdInput = z.infer<
    typeof GetDeliveriesBySourceIdSchema
>;

export type GetDeliveriesByTargetInput = z.infer<typeof TargetQuerySchema>;
export type OverviewFilterInput = z.infer<typeof OverviewFilterSchema>;
