import { ProcessingStatus } from '@kyrazo/shared';
import z from 'zod';

const objectIdSchema = z
    .string()
    .regex(/^([a-z]{3}_)?[0-9a-fA-F]{24}$/, 'Invalid ID format')
    .transform((val: string) => (val.includes('_') ? val.split('_')[1] : val));

const TargetSchema = z.object({
    targetId: objectIdSchema,
});


export const PublishEventSchema = z.object({
    eventType: z.string().min(1, 'Event type is required'),
    payload: z.any(),
    previous: z.any().optional(),
    targets: z.array(TargetSchema).min(1, 'At least one target is required'),
});

export const BatchPublishEventsSchema = z.array(PublishEventSchema);

export const ReceivedEventSchema = z.object({
    workspaceId: objectIdSchema,
    source: z.string('Source is required.').min(1, 'Source cannot be empty.'),

    headers: z
        .record(z.string(), z.string())
        .refine((obj: Record<string, string>) => Object.keys(obj).length > 0, {
            message: 'Headers object cannot be empty.',
        }),

    body: z.any().refine((val: any) => val !== null && val !== undefined, {
        message: 'Request body is required and cannot be null or undefined.',
    }),

    processingStatus: z.enum(ProcessingStatus).default(ProcessingStatus.PENDING).optional(),

    processingError: z.string().optional(),

    associatedEventId: z.string().optional(),
});

export type TargetInput = z.infer<typeof TargetSchema> & {
    targetUrl: string;
};
export type PublishedEventInput = z.infer<typeof PublishEventSchema>;
export type CreatePublishedEvent = z.infer<typeof PublishEventSchema> & {
    eventId: string;
    workspaceId: string;
    namespaceId: string;
    sourceType: 'publish';
    timestamp: number;
    shard: number;
    targets: TargetInput[];
};

export type BatchPublishedEventInput = z.infer<typeof BatchPublishEventsSchema>;
export type BatchCreatePublishedEvent = Array<CreatePublishedEvent>;
