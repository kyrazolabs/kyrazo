import { z } from 'zod';

const transformIdSchema = z
    .string()
    .regex(/^trf_[0-9a-fA-F]{24}$/, 'Invalid Transform ID format')
    .transform((val: string) => val.split('_')[1]);

const versionSchema = z.coerce.number().int().min(1);

export const CreateTransformSchema = z.object({
    name: z
        .string()
        .min(3, 'Name must be at least 3 characters')
        .max(100, 'Name must be at most 100 characters'),
    description: z.string().max(500, 'Description must be at most 500 characters').optional(),
    code: z
        .string()
        .min(10, 'Code must be at least 10 characters')
        .max(50000, 'Code must be at most 50,000 characters'),
    isActive: z.boolean().default(true),
});

export const UpdateTransformSchema = z.object({
    name: z
        .string()
        .min(3, 'Name must be at least 3 characters')
        .max(100, 'Name must be at most 100 characters')
        .optional(),
    description: z.string().max(500, 'Description must be at most 500 characters').optional(),
    code: z
        .string()
        .min(10, 'Code must be at least 10 characters')
        .max(50000, 'Code must be at most 50,000 characters')
        .optional(),
    isActive: z.boolean().optional(),
});

export const TestTransformSchema = z.object({
    code: z
        .string()
        .min(10, 'Code must be at least 10 characters')
        .max(50000, 'Code must be at most 50,000 characters'),
    payload: z.any().default({}),
});

export const SearchTransformSchema = z.object({
    q: z.string().optional(),
    isActive: z.boolean().optional(),
    limit: z.coerce.number().min(1).max(100).default(10),
    page: z.coerce.number().min(1).default(1),
});

export const TransformIdParamSchema = z.object({
    id: transformIdSchema,
});

export const RollbackParamSchema = z.object({
    id: transformIdSchema,
    version: versionSchema,
});
