import z from 'zod';

export const SupportTicketSchema = z.object({
    subject: z
        .string()
        .min(3, 'Subject must be at least 3 characters')
        .max(150, 'Subject must be at most 150 characters'),
    message: z
        .string()
        .min(10, 'Message must be at least 10 characters')
        .max(5000, 'Message must be at most 5000 characters'),
    Types: z.string().min(2, 'Type is required'),
    Category: z.string().min(2, 'Category is required'),
});

export type CreateSupportTicketInput = z.infer<typeof SupportTicketSchema>;
