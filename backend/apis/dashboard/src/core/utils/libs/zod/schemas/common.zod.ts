import { z } from 'zod';

// Common header validation schemas
export const NamespaceHeadersSchema = z.object({
    'x-workspace-id': z
        .string()
        .regex(/^(wsp_)?[0-9a-fA-F]{24}$/, 'Invalid ID format')
        .transform((val: string) => (val.includes('_') ? val.split('_')[1] : val)),
    'x-namespace-id': z
        .string()
        .regex(/^(ns_)?[0-9a-fA-F]{24}$/, 'Invalid ID format')
        .transform((val: string) => (val.includes('_') ? val.split('_')[1] : val)),
});

export const GetNamespaceByIdSchema = z.object({
    namespaceId: z
        .string()
        .regex(/^(ns_)?[0-9a-fA-F]{24}$/, 'Invalid ID format')
        .transform((val: string) => (val.includes('_') ? val.split('_')[1] : val)),
});

// Type exports
export type NamespaceHeadersInput = z.infer<typeof NamespaceHeadersSchema>;
