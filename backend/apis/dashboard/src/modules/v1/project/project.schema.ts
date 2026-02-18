import { z } from 'zod';

// Common schemas
const objectIdSchema = z
    .string()
    .regex(/^([a-z]{3}_)?[0-9a-fA-F]{24}$/, 'Invalid ID format')
    .transform((val: string) => (val.includes('_') ? val.split('_')[1] : val));
const nameSchema = z
    .string()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name is too long')
    .trim();
const descriptionSchema = z.string().max(2000, 'Description is too long').optional().nullable();

// Project schemas
export const CreateProjectSchema = z.object({
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

export const UpdateProjectSchema = CreateProjectSchema.partial();

export const GetProjectByIdSchema = z.object({
    projectId: objectIdSchema,
});

export const FilterProjectSchema = z.object({
    q: z.string().optional().default(''),
    limit: z.coerce.number().min(1).max(100).default(10),
    page: z.coerce.number().min(1).default(1),
});

// Type exports
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type GetProjectByIdInput = z.infer<typeof GetProjectByIdSchema>;
export type FilterProjectInput = z.infer<typeof FilterProjectSchema>;
