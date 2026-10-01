import z from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const TargetQuerySchema = z.object({
    targetId: objectIdSchema,
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

export type GetDeliveryByIdInput = z.infer<typeof GetDeliveryByIdSchema>;
export type GetDeliveriesBySourceIdInput = z.infer<typeof GetDeliveriesBySourceIdSchema>;

export type TargetQueryInput = z.infer<typeof TargetQuerySchema>;
export type OverviewFilterInput = z.infer<typeof OverviewFilterSchema>;
