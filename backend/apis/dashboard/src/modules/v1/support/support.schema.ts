import z from 'zod';

// Define Types explicitly
export const SupportTypes = [
    'Bug',
    'Feature request',
    'Billing',
    'Security',
    'Abuse',
    'Others',
] as const;

// Define Categories
export const BugCategories = [
    'API',
    'Webhook Delivery',
    'Dashboard',
    'SDKs',
] as const;
export const FeatureCategories = [
    'Ingest',
    'Dispatch',
    'Filters',
    'Analytics',
    'Sources',
    'Connecters',
] as const;
export const BillingCategories = [
    'Invoices',
    'Refunds',
    'Usage Limits',
] as const;

export const SupportTicketSchema = z
    .object({
        subject: z
            .string()
            .min(3, 'Subject must be at least 3 characters')
            .max(150, 'Subject must be at most 150 characters'),
        message: z
            .string()
            .min(10, 'Message must be at least 10 characters')
            .max(5000, 'Message must be at most 5000 characters'),
        Types: z.enum(SupportTypes),
        Category: z.string().min(2, 'Category is required'),
    })
    .superRefine((data, ctx) => {
        if (data.Types === 'Bug') {
            if (!BugCategories.includes(data.Category as any)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['Category'],
                    message: `Invalid Category for Bug. Allowed: ${BugCategories.join(', ')}`,
                });
            }
        } else if (data.Types === 'Feature request') {
            if (!FeatureCategories.includes(data.Category as any)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['Category'],
                    message: `Invalid Category for Feature request. Allowed: ${FeatureCategories.join(', ')}`,
                });
            }
        } else if (data.Types === 'Billing') {
            if (!BillingCategories.includes(data.Category as any)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['Category'],
                    message: `Invalid Category for Billing. Allowed: ${BillingCategories.join(', ')}`,
                });
            }
        }
        // For other types, we accept any string for now, or could enforce a restricted set if needed.
    });

export type CreateSupportTicketInput = z.infer<typeof SupportTicketSchema>;
