import { z } from 'zod';

// Common header validation schemas
export const NamespaceHeadersSchema = z.object({
    'x-workspace-id': z.string().min(1, 'Workspace ID is required'),
    'x-namespace-id': z.string().min(1, 'Namespace ID is required'),
});

// Populated ID validation schema (handles both raw ID strings and populated objects)
export const PopulatedIdSchema = z.union([
    z.string(),
    z.object({ id: z.string() }).transform((val) => val.id),
    z.object({ _id: z.any() }).transform((val) => String(val._id)),
]);

// Type exports
export type NamespaceHeadersInput = z.infer<typeof NamespaceHeadersSchema>;
export type PopulatedIdInput = z.infer<typeof PopulatedIdSchema>;
