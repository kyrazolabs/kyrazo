import { z } from 'zod';

// Common header validation schemas
export const NamespaceHeadersSchema = z.object({
    'x-workspace-id': z.string().min(1, 'Workspace ID is required'),
    'x-namespace-id': z.string().min(1, 'Namespace ID is required'),
});

// Type exports
export type NamespaceHeadersInput = z.infer<typeof NamespaceHeadersSchema>;
