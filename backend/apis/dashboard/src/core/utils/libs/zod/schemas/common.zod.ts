import { z } from 'zod';

// Common header validation schemas
export const ProjectHeadersSchema = z.object({
    'x-workspace-id': z
        .string()
        .regex(/^(wsp_)?[0-9a-fA-F]{24}$/, 'Invalid ID format')
        .transform((val: string) => (val.includes('_') ? val.split('_')[1] : val)),
    'x-project-id': z
        .string()
        .regex(/^(pro_)?[0-9a-fA-F]{24}$/, 'Invalid ID format')
        .transform((val: string) => (val.includes('_') ? val.split('_')[1] : val)),
});

export const GetProjectByIdSchema = z.object({
    projectId: z
        .string()
        .regex(/^(pro_)?[0-9a-fA-F]{24}$/, 'Invalid ID format')
        .transform((val: string) => (val.includes('_') ? val.split('_')[1] : val)),
});

// Type exports
export type ProjectHeadersInput = z.infer<typeof ProjectHeadersSchema>;
