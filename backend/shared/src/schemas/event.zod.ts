import { ProcessingStatus } from '../types';
import z from 'zod';

const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const TargetSchema = z.object({
    targetId: z
        .string()
        .min(4, 'Target ID must be more than 4 character ')
        .optional(),
    targetUrl: z.string().url('Invalid source URL'),
});

const MetaSchema = z.object({
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    maxRetries: z.number().int().min(0).max(10).default(3),
    insertedAt: z.date().default(new Date()),
});

const EventDataSchema = z.any();

export const PublishEventSchema = z.object({
    sourceId: objectIdSchema.min(1, 'Source ID is required'),
    eventType: z.string().min(1, 'Event type is required'),
    payload: EventDataSchema,
    targets: z.array(TargetSchema).min(1, 'At least one target is required'),
    meta: MetaSchema.optional().default(() => ({
        priority: 'normal' as const,
        maxRetries: 3,
        insertedAt: new Date(),
    })),
});

export const BatchPublishEventsSchema = z.array(PublishEventSchema);

export const ReceivedEventSchema = z.object({
    workspaceId: objectIdSchema,
    source: z.string('Source is required.').min(1, 'Source cannot be empty.'),

    headers: z
        .record(z.string(), z.string())
        .refine(obj => Object.keys(obj).length > 0, {
            message: 'Headers object cannot be empty.',
        }),

    body: z.any().refine(val => val !== null && val !== undefined, {
        message: 'Request body is required and cannot be null or undefined.',
    }),

    processingStatus: z
        .enum(ProcessingStatus)
        .default(ProcessingStatus.PENDING)
        .optional(),

    processingError: z.string().optional(),

    associatedEventId: z.string().optional(),
});

export type PublishedEventInput = z.infer<typeof PublishEventSchema>;
export type CreatePublishedEvent = z.infer<typeof PublishEventSchema> & {
    eventId: string;
    workspaceId: string;
    sourceType: 'publish';
    timestamp: number;
};

export type BatchPublishedEventInput = z.infer<typeof BatchPublishEventsSchema>;
export type BatchCreatePublishedEvent = Array<CreatePublishedEvent>;
