import { z } from 'zod';

// Base subscription schema
const BaseSubscriptionSchema = z.object({
    planId: z.string(),
    quantity: z.number().int().min(1).default(1),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

// Create subscription DTO
export const CreateSubscriptionDto = BaseSubscriptionSchema.extend({
    idempotencyKey: z.string().optional(),
});

// Change plan DTO
export const ChangePlanDto = z.object({
    planId: z.string(),
    prorate: z.boolean().default(true),
    quantity: z.number().int().min(1).optional(),
});

// Cancel subscription DTO
export const CancelSubscriptionDto = z.object({
    cancelAtPeriodEnd: z.boolean().default(true),
    reason: z.string().optional(),
});

// Get subscription by ID DTO
export const GetSubscriptionByIdDto = z.object({
    id: z.string(),
});

// List subscriptions query DTO
export const ListSubscriptionsQueryDto = z.object({
    status: z.enum(['active', 'trial', 'past_due', 'canceled', 'incomplete']).optional(),
    limit: z
        .string()
        .transform(val => parseInt(val))
        .optional(),
    offset: z
        .string()
        .transform(val => parseInt(val))
        .optional(),
});

// Response DTOs
export const SubscriptionResponseDto = z.object({
    id: z.string(),
    workspaceId: z.string(),
    userId: z.string(),
    planId: z.string(),
    planSnapshot: z.object({
        planId: z.string(),
        name: z.string(),
        slug: z.string(),
        priceCents: z.number(),
        currency: z.string(),
        interval: z.enum(['month', 'year']),
        features: z.record(z.string(), z.unknown()),
        limits: z.object({
            eventsPerSecond: z.number(),
            eventsPerMonth: z.number(),
            maxProjects: z.number(),
            maxMembers: z.number(),
            maxConnectors: z.number(),
            maxIntegrations: z.number(),
            maxConcurrent: z.number(),
        }),
        stripePriceId: z.string().optional(),
    }),
    status: z.enum(['active', 'trial', 'past_due', 'canceled', 'incomplete']),
    stripeSubscriptionId: z.string().optional(),
    currentPeriodStart: z.date(),
    currentPeriodEnd: z.date(),
    trialEnd: z.date().optional(),
    quantity: z.number(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    canceledAt: z.date().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const SubscriptionsListResponseDto = z.object({
    subscriptions: z.array(SubscriptionResponseDto),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
});

// Type exports
export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionDto>;
export type ChangePlanInput = z.infer<typeof ChangePlanDto>;
export type CancelSubscriptionInput = z.infer<typeof CancelSubscriptionDto>;
export type GetSubscriptionByIdInput = z.infer<typeof GetSubscriptionByIdDto>;
export type ListSubscriptionsQueryInput = z.infer<typeof ListSubscriptionsQueryDto>;
export type SubscriptionResponse = z.infer<typeof SubscriptionResponseDto>;
export type SubscriptionsListResponse = z.infer<typeof SubscriptionsListResponseDto>;
