import { z } from 'zod';

// Base plan schema
const BasePlanSchema = z.object({
    name: z.string().min(2).max(100),
    slug: z
        .string()
        .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
    description: z.string().max(500).optional(),
    priceCents: z.number().int().min(0),
    currency: z.enum(['USD', 'EUR', 'GBP']).default('EUR'),
    interval: z.enum(['month', 'year']),
    features: z.object({
        workers: z.union([z.number(), z.string()]),
        ingest: z.boolean(),
        dispatch: z.boolean(),
        support: z.string(),
        sla: z.string(),
        analytics: z.string(),
        retentionDays: z.number().int().min(0),
        customHeaders: z.boolean(),
        customTimeout: z.boolean(),
        customRetries: z.boolean(),
        forwardConfiguration: z.boolean(),
        apiAccess: z.boolean(),
        batchProcessing: z.boolean(),
        ipWhitelisting: z.boolean().optional(),
        customSla: z.boolean().optional(),
        customDomain: z.boolean().optional(),
        dedicatedInfrastructure: z.boolean().optional(),
        sso: z.boolean().optional(),
    }),
    limits: z.object({
        eventsPerSecond: z.number().int().min(0),
        eventsPerMonth: z.number().int().min(0),
        maxNamespaces: z.number().int().min(0),
        maxMembers: z.number().int().min(0),
        maxConnectors: z.number().int().min(0),
        maxIntegrations: z.number().int().min(0),
        maxWorkers: z.number().int().min(0),
    }),
    benefits: z.array(z.string()).default([]),
    stripePriceId: z.string().optional(),
    overagePriceCents: z.number().max(1000),
    meterId: z.string().min(30).max(50).optional(),
    meterEventName: z.string().min(2).max(100),
    isActive: z.boolean().default(true),
});

// Create plan DTO
export const CreatePlanDto = BasePlanSchema;

// Update plan DTO
export const UpdatePlanDto = BasePlanSchema.partial().extend({
    id: z.string(),
});

// Get plan by slug DTO
export const GetPlanBySlugDto = z.object({
    slug: z.string(),
});

// List plans query DTO
export const ListPlansQueryDto = z.object({
    active: z
        .string()
        .transform(val => val === 'true')
        .optional(),
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
export const PlanResponseDto = BasePlanSchema.extend({
    id: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const PlansListResponseDto = z.object({
    plans: z.array(PlanResponseDto),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
});

// Type exports
export type CreatePlanInput = z.infer<typeof CreatePlanDto>;
export type UpdatePlanInput = z.infer<typeof UpdatePlanDto>;
export type GetPlanBySlugInput = z.infer<typeof GetPlanBySlugDto>;
export type ListPlansQueryInput = z.infer<typeof ListPlansQueryDto>;
export type PlanResponse = z.infer<typeof PlanResponseDto>;
export type PlansListResponse = z.infer<typeof PlansListResponseDto>;
