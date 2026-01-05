import { z } from 'zod';

// Common header validation schemas
export const ProjectHeadersSchema = z.object({
    'x-workspace-id': z.string().min(1, 'Workspace ID is required'),
    'x-project-id': z.string().min(1, 'Project ID is required'),
});

// Type exports
export type ProjectHeadersInput = z.infer<typeof ProjectHeadersSchema>;