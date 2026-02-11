export interface PricingPlan {
    name: string;
    slug: string;
    description: string;
    priceCentsMonthly: number;
    priceCentsYearly: number;
    currency: string;
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
    benefits: string[];
    stripePriceId?: {
        monthly: string;
        yearly: string;
    };
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
        description: 'Perfect for exploring Kyrazo and side projects.',
        priceCentsMonthly: 0,
        priceCentsYearly: 0,
        currency: 'EUR',
        features: {
            workers: 'shared',
            support: 'Email support (24h response)',
            sla: '99.9% uptime',
            customDomain: false,
            analytics: 'Standard',
            retentionDays: 30,
            webhookRetries: 5,
            customHeaders: true,
        },
        limits: {
            eventsPerSecond: 60,
            eventsPerMonth: 100000,
            maxProjects: 5,
            maxMembers: 5,
            maxConnectors: 10,
            maxIntegrations: 15,
            maxConcurrent: 20,
        },
        benefits: [
            '60 events/sec throughput',
            '100k events included',
            '30 days data retention',
            'Standard analytics',
            'Community support',
        ],
        overagePriceCents: 0,
        meterId: 'meter_free_plan',
        isActive: true,
    },
    {
        name: 'Starter',
        slug: 'starter',
        description: 'Perfect for small teams and growing applications.',
        priceCentsMonthly: 2900,
        priceCentsYearly: 2400,
        currency: 'EUR',
        features: {
            workers: 4,
            support: 'Priority email support',
            sla: '99% uptime',
            customDomain: true,
            analytics: 'Advanced',
            retentionDays: 30,
            webhookRetries: 5,
            customHeaders: true,
        },
        limits: {
            eventsPerSecond: 100,
            eventsPerMonth: 250000,
            maxProjects: 10,
            maxMembers: 5,
            maxConnectors: 25,
            maxIntegrations: 30,
            maxConcurrent: 40,
        },
        benefits: [
            'Everything in Free',
            '100 events/sec capacity',
            '250k events included',
            'Custom domains enabled',
            'Priority email support',
        ],
        stripePriceId: {
            monthly: 'price_starter_monthly_eur',
            yearly: 'price_starter_yearly_eur',
        },
        overagePriceCents: 350,
        meterId: 'meter_starter_webhook_events_001',
        isActive: true,
    },
    {
        name: 'Professional',
        slug: 'professional',
        description: 'Built for production-grade applications.',
        priceCentsMonthly: 9900,
        priceCentsYearly: 7900,
        currency: 'EUR',
        features: {
            workers: 10,
            support: 'Priority email & chat (4h)',
            sla: '99.9% uptime',
            customDomain: true,
            analytics: 'Real-time monitoring',
            retentionDays: 90,
            webhookRetries: 10,
            customHeaders: true,
            ipWhitelisting: true,
            customTransformations: true,
            batchProcessing: true,
            apiAccess: 'Full REST API',
        },
        limits: {
            eventsPerSecond: 250,
            eventsPerMonth: 2000000,
            maxProjects: 50,
            maxMembers: 20,
            maxConnectors: 100,
            maxIntegrations: 200,
            maxConcurrent: 100,
        },
        benefits: [
            'Everything in Starter',
            '250 events/sec capacity',
            '2M events included',
            '90 days data retention',
            'Real-time monitoring',
            'Custom transformations',
        ],
        stripePriceId: {
            monthly: 'price_professional_monthly_eur',
            yearly: 'price_professional_yearly_eur',
        },
        overagePriceCents: 300,
        meterId: 'meter_professional_webhook_events_002',
        isActive: true,
        highlighted: true,
        tag: 'MOST POPULAR',
    },
    {
        name: 'Enterprise',
        slug: 'enterprise',
        description: 'Mission-critical infrastructure for scale.',
        priceCentsMonthly: 49900,
        priceCentsYearly: 39900,
        currency: 'EUR',
        features: {
            workers: 40,
            support: '24/7 dedicated support',
            sla: '99.99% uptime SLA',
            customDomain: true,
            analytics: 'Custom dashboards',
            retentionDays: 365,
            webhookRetries: -1,
            customHeaders: true,
            ipWhitelisting: true,
            customTransformations: true,
            batchProcessing: true,
            apiAccess: 'REST + GraphQL',
            dedicatedInfrastructure: true,
            customIntegrations: true,
            accountManager: true,
            onboarding: 'Included',
            sso: true,
        },
        limits: {
            eventsPerSecond: 1000,
            eventsPerMonth: 25000000,
            maxProjects: -1,
            maxMembers: -1,
            maxConnectors: -1,
            maxIntegrations: -1,
            maxConcurrent: 500,
        },
        benefits: [
            'Unlimited horizontal scale',
            'Dedicated infrastructure',
            'Custom integrations',
            'White-glove onboarding',
            'SAML/SSO enabled',
            '24/7 Phone support',
        ],
        stripePriceId: {
            monthly: 'price_enterprise_monthly_eur',
            yearly: 'price_enterprise_yearly_eur',
        },
        overagePriceCents: 250,
        meterId: 'meter_enterprise_webhook_events_003',
        isActive: true,
    },
];
