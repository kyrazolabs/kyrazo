import { IPlan } from '../../types';

export const plansData: Partial<IPlan>[] = [
    {
        name: 'Free',
        slug: 'free',
        description: 'Free plan for testing and small projects',
        priceCents: 0,
        currency: 'USD',
        interval: 'month',
        features: {
            workers: 'shared',
            ingest: true,
            dispatch: true,
            support: 'community',
            sla: 'best effort',
            analytics: 'basic',
            retentionDays: 1,
            customHeaders: false,
            customTimeout: false,
            customRetries: false,
            forwardConfiguration: false,
            apiAccess: true,
            batchProcessing: false,
        },
        limits: {
            eventsPerSecond: 5,
            eventsPerMonth: 10000,
            maxNamespaces: 2,
            maxMembers: 2,
            maxConnectors: 5,
            maxIntegrations: 5,
            maxWorkers: 0,
        },
        stripeProductId: 'prod_free',
        stripePriceId: 'price_free',
        isActive: true,
    },
];
