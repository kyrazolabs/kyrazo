import { z } from 'zod';

// Common header validation schemas
export const ProjectHeadersSchema = z.object({
    'x-workspace-id': z.string().min(1, 'Workspace ID is required'),
    'x-project-id': z.string().min(1, 'Project ID is required'),
});
export const GetProjectByIdSchema = z.object({
    projectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
});

// Type exports
export type GetProjectByIdInput = z.infer<typeof GetProjectByIdSchema>;
export type ProjectHeadersInput = z.infer<typeof ProjectHeadersSchema>;
