import { IPlanLimits, IPlanFeatures } from '../types';

export const FREE_PLAN_LIMITS: IPlanLimits = {
    eventsPerSecond: 25,
    eventsPerMonth: 100000,
    maxNamespaces: 3,
    maxMembers: 3,
    maxConnectors: 3,
    maxIntegrations: 1,
    maxWorkers: 0,
};

export const FREE_PLAN_FEATURES: IPlanFeatures = {
    workers: 0,
    ingest: true,
    dispatch: true,
    support: 'community',
    sla: 'none',
    analytics: 'basic',
    retentionDays: 7,
    customHeaders: false,
    customTimeout: false,
    customRetries: false,
    forwardConfiguration: false,
    apiAccess: false,
    batchProcessing: false,
};

export const DEFAULT_FREE_SUBSCRIPTION: any = {
    planSnapshot: {
        name: 'Free',
        slug: 'free',
        priceCents: 0,
        currency: 'USD',
        interval: 'month',
        features: FREE_PLAN_FEATURES,
        limits: FREE_PLAN_LIMITS,
        benefits: [],
        stripeProductId: 'free',
        stripePriceId: 'free',
        createdAt: new Date(),
    },
    status: 'active',
    paymentFailureCount: 0,
    quantity: 1,
    billingCycleAnchor: new Date(),
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
    createdAt: new Date(),
    updatedAt: new Date(),
};
