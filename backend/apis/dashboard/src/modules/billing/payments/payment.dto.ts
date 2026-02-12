import { z } from 'zod';

// Create checkout session DTO
// Create subscription payment DTO
export const CreateSubscriptionPaymentDto = z.object({
    planId: z.string(),
    quantity: z.number().int().min(1).default(1),
    metadata: z.record(z.string(), z.string()).optional(),
});

// Checkout session response
// Payment response
export const PaymentResponseDto = z.object({
    subscriptionId: z.string(),
    clientSecret: z.string(),
    invoiceId: z.string(),
    hostedInvoiceUrl: z.string().optional(),
});

// Source event DTO (raw body from Stripe)
export const StripeSourceDto = z.object({
    id: z.string(),
    object: z.string(),
    api_version: z.string().optional(),
    created: z.number(),
    data: z.object({
        object: z.record(z.string(), z.unknown()),
        previous_attributes: z.record(z.string(), z.unknown()).optional(),
    }),
    livemode: z.boolean(),
    pending_sources: z.number(),
    request: z
        .object({
            id: z.string().optional(),
            idempotency_key: z.string().optional(),
        })
        .optional(),
    type: z.string(),
});

// Billing portal session DTO
export const CreateBillingPortalDto = z.object({
    returnUrl: z.string().url(),
});

// Billing portal response
export const BillingPortalResponseDto = z.object({
    url: z.string().url(),
});

// Type exports
export type CreateSubscriptionPaymentInput = z.infer<
    typeof CreateSubscriptionPaymentDto
>;
export type PaymentResponse = z.infer<typeof PaymentResponseDto>;
export type StripeSourceInput = z.infer<typeof StripeSourceDto>;
export type CreateBillingPortalInput = z.infer<typeof CreateBillingPortalDto>;
export type BillingPortalResponse = z.infer<typeof BillingPortalResponseDto>;
