import { z } from 'zod';

// Common schemas
const objectIdSchema = z
    .string()
    .regex(/^([a-z]{2}_)?[0-9a-fA-F]{24}$/, 'Invalid ID format')
    .transform((val: string) => (val.includes('_') ? val.split('_')[1] : val));
const nameSchema = z
    .string()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name is too long')
    .trim();
const descriptionSchema = z.string().max(2000, 'Description is too long').optional().nullable();

// Namespace schemas
export const CreateNamespaceSchema = z.object({
    name: nameSchema,
    description: descriptionSchema,
    whiteLabelHeaders: z
        .string()
        .max(50, 'Prefix is too long')
        .regex(/^[a-zA-Z0-9-]*$/, 'Prefix can only contain alphanumeric characters and hyphens')
        .nullable()
        .optional()
        .or(z.literal('')),
});

export const UpdateNamespaceSchema = CreateNamespaceSchema.partial();

export const GetNamespaceByIdSchema = z.object({
    namespaceId: objectIdSchema,
});

export const FilterNamespaceSchema = z.object({
    q: z.string().optional().default(''),
    limit: z.coerce.number().min(1).max(100).default(10),
    page: z.coerce.number().min(1).default(1),
});

// Type exports
export type CreateNamespaceInput = z.infer<typeof CreateNamespaceSchema>;
export type UpdateNamespaceInput = z.infer<typeof UpdateNamespaceSchema>;
export type GetNamespaceByIdInput = z.infer<typeof GetNamespaceByIdSchema>;
export type FilterNamespaceInput = z.infer<typeof FilterNamespaceSchema>;
