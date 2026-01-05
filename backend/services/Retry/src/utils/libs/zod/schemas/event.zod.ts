import z from 'zod';

const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const ForwardEventSchema = z.object({
    eventId: z.string(),
    workspaceId: z.string(),
    producerId: z.string(),
    webhookId: z.string(),
    ingressId: z.string(),
    userId: z.string(),
    source: z.string(),
    webhookType: z.enum(['forward']).default('forward'),

    headers: z.record(z.string()),
    body: z.any(),

    processingStatus: z.enum(['pending', 'processed', 'failed']),
    associatedEventId: z.string(),

    targets: z.array(z.string()),
    authenticating: z.boolean(),

    meta: z.object({
        priority: z.enum(['low', 'normal', 'high', 'urgent']),
        maxRetries: z.number(),
        insertedAt: z.date(),
    }),
});

export const PublishEventSchema = z.object({
    eventId: z.string(),
    workspaceId: z.string(),
    webhookId: objectIdSchema.min(1, 'Webhook ID is required'),
    eventType: z.string().min(1, 'Event type is required'),
    webhookType: z.enum(['publish']).default('publish'),

    payload: z.any(),
    targets: z
        .array(
            z.object({
                targetId: z
                    .string()
                    .min(4, 'Target ID must be more than 4 character ')
                    .optional(),
                targetUrl: z.string().url('Invalid webhook URL'),
            })
        )
        .min(1, 'At least one target is required'),
    meta: z
        .object({
            priority: z
                .enum(['low', 'normal', 'high', 'urgent'])
                .default('normal'),
            maxRetries: z.number().int().min(0).max(10).default(3),
            insertedAt: z.date().default(new Date()),
        })
        .optional()
        .default(() => ({
            priority: 'normal' as const,
            maxRetries: 3,
            insertedAt: new Date(),
        })),
});

export const BatchPublishEventsSchema = z.array(PublishEventSchema);

export const ReceiveEventSchema = z.object({
    eventId: z.string(),
    workspaceId: z.string(),
    producerId: z.string(),
    webhookId: z.string(),
    ingressId: z.string(),
    userId: z.string(),
    source: z.string(),
    webhookType: z.enum(['receive']).default('receive'),

    receivedAt: z.date(),
    headers: z.record(z.string()),
    body: z.record(z.string()),

    processingStatus: z.enum(['pending', 'processed', 'failed']),
    processingError: z.string().optional(),
    associatedEventId: z.string().optional(),

    forwarding: z.boolean(),
    endpoints: z.array(z.any()).optional(), // if you want strict: z.array(ObjectIdSchema)
});
export type PublishedEventInput = z.infer<typeof PublishEventSchema>;

export type CreateForwardEvent = z.infer<typeof ForwardEventSchema>
export type CreatePublishedEvent = z.infer<typeof PublishEventSchema> & {
    timestamp: number;
};
export type CreateReceiveEvent = z.infer<typeof ReceiveEventSchema>

export type BatchPublishedEventInput = z.infer<typeof BatchPublishEventsSchema>;
export type BatchCreatePublishedEvent = Array<CreatePublishedEvent>;
