import { z } from 'zod';

export const CreateASQSSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    queueUrl: z.string().url('Invalid SQS queue URL'),
    queueType: z.enum(['standard', 'fifo']).default('standard'),
    useContentBasedDeduplication: z.boolean().default(false),
    region: z.string().min(1, 'Region is required'),
    accessKeyId: z.string().min(1, 'Access key ID is required'),
    secretAccessKey: z.string().min(1, 'Secret access key is required'),
    transformId: z.string().optional(),
    enabled: z.boolean().default(true),
});

export const UpdateASQSSchema = CreateASQSSchema.partial();

export const ASQSIdParamSchema = z.object({
    id: z.string().regex(/^sqs_[a-fA-F0-9]{24}$/, 'Invalid ASQS ID format'),
});

export const TestASQSConnectionSchema = z.object({
    queueUrl: z.string().url(),
    region: z.string().min(1),
    accessKeyId: z.string().min(1),
    secretAccessKey: z.string().min(1),
});
