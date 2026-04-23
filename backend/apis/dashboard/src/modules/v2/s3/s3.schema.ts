import { z } from 'zod';

export const CreateS3Schema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    bucketName: z.string().min(1, 'Bucket name is required'),
    region: z.string().min(1, 'Region is required'),
    accessKeyId: z.string().min(1, 'Access key ID is required'),
    secretAccessKey: z.string().min(1, 'Secret access key is required'),
    endpoint: z.string().url('Invalid endpoint URL').optional().or(z.literal('')),
    transformer: z
        .object({
            code: z.string().min(1, 'Transformer code is required'),
            name: z.string().optional(),
            description: z.string().optional(),
        })
        .optional()
        .nullable(),
    enabled: z.boolean().default(true),
});

export const UpdateS3Schema = CreateS3Schema.partial();

export const S3IdParamSchema = z.object({
    id: z.string().regex(/^s3b_[a-fA-F0-9]{24}$/, 'Invalid S3 Bucket ID format'),
});

export const TestS3ConnectionSchema = z.object({
    bucketName: z.string().min(1),
    region: z.string().min(1),
    accessKeyId: z.string().min(1),
    secretAccessKey: z.string().min(1),
    endpoint: z.string().url().optional().or(z.literal('')),
});
