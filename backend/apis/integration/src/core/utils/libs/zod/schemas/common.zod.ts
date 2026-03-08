import { z } from 'zod';

// Common header validation schemas
export const NamespaceHeadersSchema = z.object({
    'x-workspace-id': z.string().min(1, 'Workspace ID is required'),
    'x-namespace-id': z.string().min(1, 'Namespace ID is required'),
});
export const GetNamespaceByIdSchema = z.object({
    namespaceId: z
        .string()
        .regex(/^(pro_)?[0-9a-fA-F]{24}$/, 'Invalid ID format')
        .transform((val: string) => (val.startsWith('pro_') ? val.split('_')[1] : val)),
});

// Type exports
export type GetNamespaceByIdInput = z.infer<typeof GetNamespaceByIdSchema>;
export type NamespaceHeadersInput = z.infer<typeof NamespaceHeadersSchema>;
