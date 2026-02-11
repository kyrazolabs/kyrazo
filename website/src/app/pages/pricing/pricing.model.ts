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
        priorityQueue?: boolean;
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

/**
 * Kyrazo Pricing Plans - Updated Strategy
 *
 * Strategy: Generous rate limit on Free (60 req/sec) but LIMITED events (50K)
 * to attract developers but force quick conversion to paid plans.
 *
 * Key Changes:
 * - Free: 60 req/sec, 50K events/month, 7 days retention
 * - Starter: €79/mo, 100 req/sec, 1M events/month, 30 days retention
 * - Professional: €149/mo, 200 req/sec, 5M events/month, 90 days retention
 * - Enterprise: €349/mo, 500 req/sec, 10M+ events/month, 90+ days retention
 */

export const PRICING_PLANS: PricingPlan[] = [
    {
        name: 'Free',
        slug: 'free',
        description:
            'Perfect for exploring Kyrazo, testing, and side projects.',
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
            '50k events included',
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
        description:
            'Perfect for startups and small platforms - production ready.',
        priceCentsMonthly: 7900, // Changed from €29 to €79
        priceCentsYearly: 79000, // €790 (10 months - 2 free)
        currency: 'EUR',
        features: {
            workers: '2 dedicated', // Changed to show specs
            support: 'Email support (24h response)',
            sla: '99.9% uptime',
            customDomain: true,
            analytics: 'Advanced',
            retentionDays: 30,
            webhookRetries: 10, // Changed from 5 to 10
            customHeaders: true,
        },
        limits: {
            eventsPerSecond: 100,
            eventsPerMonth: 1000000, // Changed from 250K to 1M
            maxProjects: 5, // Changed from 10 to 5
            maxMembers: 5,
            maxConnectors: 15, // Changed from 25 to 15
            maxIntegrations: 30,
            maxConcurrent: 25, // Changed from 40 to 25
        },
        benefits: [
            '2 Dedicated workers',
            '100 events/sec capacity',
            '1M events included',
            '30 days data retention',
            'Custom domains enabled',
            'Email support',
            // 'No watermark',
        ],
        stripePriceId: {
            monthly: 'price_starter_monthly_eur',
            yearly: 'price_starter_yearly_eur',
        },
        overagePriceCents: 200, // €2.00 per 100K events
        meterId: 'meter_starter_webhook_events_001',
        isActive: true,
    },
    {
        name: 'Professional',
        slug: 'professional',
        description:
            'Built for growing companies - high performance and professional support.',
        priceCentsMonthly: 14900, // Changed from €249 to €149
        priceCentsYearly: 149000, // €1,490 (10 months - 2 free)
        currency: 'EUR',
        features: {
            workers: '4 dedicated', // Changed to show specs
            support: 'Email & chat support (8h response)',
            sla: '99.99% uptime',
            customDomain: true,
            retentionDays: 90,
            webhookRetries: 20, // Changed from 10 to 20
            customHeaders: true,
            priorityQueue: true, // Added
            customTransformations: true,
            batchProcessing: true,
            apiAccess: 'Full REST API',
            analytics: 'Advance',
        },
        limits: {
            eventsPerSecond: 200, // Changed from 250 to 200
            eventsPerMonth: 5000000, // Changed from 2M to 5M
            maxProjects: 15, // Changed from 50 to 15
            maxMembers: 10, // Changed from 20 to 10
            maxConnectors: 50, // Changed from 100 to 50
            maxIntegrations: 150, // Changed from 200 to 150
            maxConcurrent: 50, // Changed from 100 to 50
        },
        benefits: [
            '4 Dedicated workers',
            '200 events/sec capacity',
            '5M events included',
            '90 days data retention',
            'Priority queue',
            'Custom transformations',
            'Weekly reports',
        ],
        stripePriceId: {
            monthly: 'price_professional_monthly_eur',
            yearly: 'price_professional_yearly_eur',
        },
        overagePriceCents: 150, // €1.50 per 100K events
        meterId: 'meter_professional_webhook_events_002',
        isActive: true,
        highlighted: true,
        tag: 'MOST POPULAR',
    },
    {
        name: 'Enterprise',
        slug: 'enterprise',
        description:
            'Mission-critical infrastructure for large organizations - maximum performance.',
        priceCentsMonthly: 34900, // Changed from €499 to €349
        priceCentsYearly: 349000, // €3,490 (10 months - 2 free)
        currency: 'EUR',
        features: {
            workers: '8 dedicated', // Changed to show specs
            support: '24/7 dedicated support (1h response)',
            sla: '99.99% uptime SLA + refund guarantee',
            customDomain: true,
            analytics: 'Enterprise analytics + custom dashboards',
            retentionDays: 90, // Starting point, customizable
            webhookRetries: 50, // Changed from -1 to 50
            customHeaders: true,
            ipWhitelisting: true,
            customTransformations: true,
            batchProcessing: true,
            apiAccess: 'REST',
            dedicatedInfrastructure: true,
            customIntegrations: true,
            accountManager: true,
            onboarding: 'White-glove onboarding',
            sso: true,
        },
        limits: {
            eventsPerSecond: 500, // Changed from 1000 to 500
            eventsPerMonth: 10000000, // Changed from 25M to 10M (starting point)
            maxProjects: 50, // Changed from -1 to 50
            maxMembers: 25, // Changed from -1 to 25
            maxConnectors: 200, // Changed from -1 to 200
            maxIntegrations: 1000, // Changed from -1 to 1000
            maxConcurrent: 100, // Changed from 500 to 100
        },
        benefits: [
            '8 Dedicated workers',
            '500 events/sec capacity',
            'Starting from 10M events/month',
            '90+ days retention (customizable)',
            '24/7 dedicated support',
            'Custom integrations',
            'White Label',
            'White-glove onboarding',
            'SAML/SSO enabled',
            'Account manager',
            'Custom SLA',
            'Customizable limits',
        ],
        stripePriceId: {
            monthly: 'price_enterprise_monthly_eur',
            yearly: 'price_enterprise_yearly_eur',
        },
        overagePriceCents: 100, // €1.00 per 100K events
        meterId: 'meter_enterprise_webhook_events_003',
        isActive: true,
    },
];
