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
export const BugCategories = ['API', 'Webhook Delivery', 'Dashboard', 'SDKs'] as const;
export const FeatureCategories = [
    'Ingest',
    'Dispatch',
    'Filters',
    'Analytics',
    'Sources',
    'Connectors',
] as const;
export const BillingCategories = [
    'Invoices',
    'Refunds',
    'Usage Limits',
    'Cancellation',
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
        Category: z.string().optional(),
        kind: z.enum(['support', 'cancellation']).default('support'),
    })
    .superRefine((data, ctx) => {
        const categorizedTypes = ['Bug', 'Feature request', 'Billing'];
        if (categorizedTypes.includes(data.Types)) {
            if (!data.Category) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['Category'],
                    message: `Category is required for ${data.Types}`,
                });
                return;
            }

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
        }
    });

export type CreateSupportTicketInput = z.infer<typeof SupportTicketSchema>;
