export interface PricingPlan {
    name: string;
    slug: string;
    description: string;
    priceCents: number;
    currency: string;
    interval: string;
    features: {
        workers: number | string;
        support: string;
        sla: string;
        customDomain: boolean;
        analytics: string;
        retentionDays: number;
        webhookRetries: number;
        customHeaders: boolean;
        ipWhitelisting?: boolean;
        customTransformations?: boolean;
        batchProcessing?: boolean;
        apiAccess?: string;
        dedicatedInfrastructure?: boolean;
        customIntegrations?: boolean;
        accountManager?: boolean;
        onboarding?: string;
        sso?: boolean;
    };
    limits: {
        eventsPerSecond: number;
        eventsPerMonth: number;
        maxProjects: number;
        maxMembers: number;
        maxConnectors: number;
        maxIntegrations: number;
        maxConcurrent: number;
    };
    stripePriceId: string;
    overagePriceCents: number;
    meterId: string;
    isActive: boolean;
    highlighted?: boolean;
    tag?: string;
}

export const PRICING_PLANS: PricingPlan[] = [
    {
        name: 'Free',
        slug: 'free',
        description:
            'Perfect for exploring Kyrazo and side projects. Get started with basic webhook infrastructure.',
        priceCents: 0,
        currency: 'EUR',
        interval: 'month',
        features: {
            workers: 'shared',
            support: 'Email support (24h response)',
            sla: '99.9% uptime',
            customDomain: false,
            analytics: 'Advanced',
            retentionDays: 30,
            webhookRetries: 5,
            customHeaders: true,
        },
        limits: {
            eventsPerSecond: 25,
            eventsPerMonth: 100000,
            maxProjects: 5,
            maxMembers: 5,
            maxConnectors: 10,
            maxIntegrations: 15,
            maxConcurrent: 20,
        },
        stripePriceId: 'price_starter_monthly_eur',
        overagePriceCents: 350,
        meterId: 'meter_starter_webhook_events_001',
        isActive: true,
    },
    {
        name: 'Starter',
        slug: 'starter',
        description:
            'Perfect for small teams and growing applications. Get started with essential webhook infrastructure.',
        priceCents: 2900,
        currency: 'EUR',
        interval: 'month',
        features: {
            workers: 4,
            support: 'Email support (24h response)',
            sla: '99% uptime',
            customDomain: true,
            analytics: 'Advanced',
            retentionDays: 30,
            webhookRetries: 5,
            customHeaders: true,
        },
        limits: {
            eventsPerSecond: 25,
            eventsPerMonth: 100000,
            maxProjects: 5,
            maxMembers: 5,
            maxConnectors: 10,
            maxIntegrations: 15,
            maxConcurrent: 20,
        },
        stripePriceId: 'price_starter_monthly_eur',
        overagePriceCents: 350,
        meterId: 'meter_starter_webhook_events_001',
        isActive: true,
    },
    {
        name: 'Professional',
        slug: 'professional',
        description:
            'Built for production-grade applications and medium businesses. Enhanced limits with priority support.',
        priceCents: 9900,
        currency: 'EUR',
        interval: 'month',
        features: {
            workers: 10,
            support: 'Priority email & chat (4h response)',
            sla: '99.9% uptime',
            customDomain: true,
            analytics: 'Advanced + Real-time monitoring',
            retentionDays: 90,
            webhookRetries: 10,
            customHeaders: true,
            ipWhitelisting: true,
            customTransformations: true,
            batchProcessing: true,
            apiAccess: 'Full REST API',
        },
        limits: {
            eventsPerSecond: 100,
            eventsPerMonth: 1000000,
            maxProjects: 20,
            maxMembers: 15,
            maxConnectors: 50,
            maxIntegrations: 100,
            maxConcurrent: 50,
        },
        stripePriceId: 'price_professional_monthly_eur',
        overagePriceCents: 300,
        meterId: 'meter_professional_webhook_events_002',
        isActive: true,
        highlighted: true,
        tag: 'MOST POPULAR',
    },
    {
        name: 'Enterprise',
        slug: 'enterprise',
        description:
            'Mission-critical webhook infrastructure for large organizations. Unlimited resources with dedicated support.',
        priceCents: 49900,
        currency: 'EUR',
        interval: 'month',
        features: {
            workers: 40,
            support: '24/7 priority phone & chat (1h response)',
            sla: '99.99% uptime with penalties',
            customDomain: true,
            analytics: 'Enterprise analytics + Custom dashboards',
            retentionDays: 365,
            webhookRetries: -1,
            customHeaders: true,
            ipWhitelisting: true,
            customTransformations: true,
            batchProcessing: true,
            apiAccess: 'Full REST API + GraphQL',
            dedicatedInfrastructure: true,
            customIntegrations: true,
            accountManager: true,
            onboarding: 'White-glove onboarding',
            sso: true,
        },
        limits: {
            eventsPerSecond: 500,
            eventsPerMonth: 10000000,
            maxProjects: -1,
            maxMembers: -1,
            maxConnectors: -1,
            maxIntegrations: -1,
            maxConcurrent: 200,
        },
        stripePriceId: 'price_enterprise_monthly_eur',
        overagePriceCents: 250,
        meterId: 'meter_enterprise_webhook_events_003',
        isActive: true,
    },
];
