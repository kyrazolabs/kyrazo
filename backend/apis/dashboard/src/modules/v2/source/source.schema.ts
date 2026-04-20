import { z } from 'zod';

export const CreateSourceSchema = z.object({
    name: z.string().min(3).max(100),
    description: z.string().max(500).optional(),
    service: z
        .enum(['stripe', 'paypal', 'github', 'shopify', 'slack', 'webflow', 'general'])
        .default('general'),
    type: z.string().default('receive'), // Currently only supporting receive v2
    forwarding: z.boolean().default(false),
    destination: z
        .object({
            endpoints: z.array(z.string()).optional(),
            s3bucket: z.array(z.string()).optional(),
            asqs: z.array(z.string()).optional(),
        })
        .optional(),
    eventTypes: z.array(z.string()).optional().default([]),
    retryPolicy: z
        .object({
            maxAttempts: z.number().min(1).max(10).default(3),
        })
        .optional(),
    authentication: z
        .object({
            enabled: z.boolean().default(false),
            type: z.enum(['service', 'hmac', 'api_key', 'basic_auth']).optional(),
            service: z
                .object({
                    secret: z.string().min(3).max(250),
                })
                .optional(),
        })
        .optional(),
    transformer: z
        .object({
            code: z.string().min(1, 'Transformer code is required'),
            name: z.string().optional(),
            description: z.string().optional(),
        })
        .optional(),
});

export const UpdateSourceSchema = z.object({
    name: z.string().min(3).max(100).optional(),
    description: z.string().max(500).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    forwarding: z.boolean().optional(),
    destination: z
        .object({
            endpoints: z.array(z.string()).optional(),
            s3bucket: z.array(z.string()).optional(),
            asqs: z.array(z.string()).optional(),
        })
        .optional(),
    eventTypes: z.array(z.string()).optional(),
    retryPolicy: z
        .object({
            maxAttempts: z.number().min(1).max(10),
        })
        .optional(),
    transformer: z
        .object({
            code: z.string().min(1, 'Transformer code is required'),
            name: z.string().optional(),
            description: z.string().optional(),
        })
        .nullable()
        .optional(),
});

export const SourceIdParamSchema = z.object({
    id: z.string().regex(/^src_[0-9a-fA-F]{24}$/, 'Invalid Source ID format'),
});

export const SearchSourceSchema = z.object({
    q: z.string().optional(),
    status: z.enum(['active', 'inactive', 'paused']).optional(),
    limit: z.coerce.number().min(1).max(100).default(10),
    page: z.coerce.number().min(1).default(1),
});
