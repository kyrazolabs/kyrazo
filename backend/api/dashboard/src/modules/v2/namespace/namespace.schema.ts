import { z } from 'zod';

export const CreateNamespaceSchema = z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(2000).optional().nullable(),
    whiteLabelHeaders: z.string().optional().nullable(),
    transformer: z
        .object({
            code: z.string().min(1, 'Transformer code is required'),
            name: z.string().optional(),
            description: z.string().optional(),
        })
        .optional()
        .nullable(),
});

export const UpdateNamespaceSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(2000).optional().nullable(),
    whiteLabelHeaders: z.string().optional().nullable(),
    status: z.enum(['active', 'on_hold', 'completed', 'cancelled', 'planning']).optional(),
    isArchived: z.boolean().optional(),
    transformer: z
        .object({
            code: z.string().min(1, 'Transformer code is required'),
            name: z.string().optional(),
            description: z.string().optional(),
        })
        .optional()
        .nullable(),
});

export const NamespaceIdParamSchema = z.object({
    namespaceId: z.string().regex(/^ns_[0-9a-fA-F]{24}$/, 'Invalid Namespace ID format'),
});

export const SearchNamespaceSchema = z.object({
    q: z.string().optional(),
    status: z.enum(['active', 'on_hold', 'completed', 'cancelled', 'planning']).optional(),
    limit: z.coerce.number().min(1).max(100).default(10),
    page: z.coerce.number().min(1).default(1),
});
