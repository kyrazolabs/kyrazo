export interface PricingPlan {
    id?: string;
    originalPlan?: any;
    name: string;
    slug: string;
    description: string;
    priceCentsMonthly: number;
    priceCentsYearly: number;
    currency: string;
    features: {
        workers: number | string;
        ingest: boolean;
        dispatch: boolean;
        support: string;
        sla: string;
        analytics: string;
        retentionDays: number;
        customHeaders: boolean;
        customTimeout: boolean;
        customRetries: boolean;
        forwardConfiguration: boolean;
        apiAccess: boolean;
        batchProcessing: boolean;

        // custom plan features
        ipWhitelisting?: boolean;
        whiteLabelHeaders?: boolean;
        customSla?: boolean;
        customDomain?: boolean;
        dedicatedInfrastructure?: boolean;
        sso?: boolean;
    };
    limits: {
        eventsPerSecond: number;
        eventsPerMonth: number;
        maxProjects: number;
        maxMembers: number;
        maxConnectors: number;
        maxIntegrations: number;
        maxWorkers: number;
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

export const MANUAL_CUSTOM_PLAN: PricingPlan = {
    name: 'Custom',
    slug: 'custom',
    description:
        'Bespoke infrastructure and dedicated support for large-scale operations.',
    priceCentsMonthly: 0, // Contact sales
    priceCentsYearly: 0,
    currency: 'EUR',
    features: {
        workers: 'Custom',
        ingest: true,
        dispatch: true,
        support: '24/7 Dedicated Account Manager',
        sla: 'Custom Uptime SLA',
        analytics: 'Custom Dashboards & Raw Data Export',
        retentionDays: 365,
        customHeaders: true,
        customTimeout: true,
        customRetries: true,
        forwardConfiguration: true,
        apiAccess: true,
        batchProcessing: true,
        ipWhitelisting: true,
        whiteLabelHeaders: true,
        customSla: true,
        customDomain: true,
        dedicatedInfrastructure: true,
        sso: true,
    },
    limits: {
        eventsPerSecond: -1,
        eventsPerMonth: -1,
        maxProjects: -1,
        maxMembers: -1,
        maxConnectors: -1,
        maxIntegrations: -1,
        maxWorkers: -1,
    },
    benefits: [
        'Unlimited event throughput',
        'Unlimited data retention',
        '24/7 Dedicated support',
        'Custom billing & invoicing',
        'White-label options',
        'SAML/SSO & Advanced Security',
    ],
    isActive: true,
    overagePriceCents: 0,
    meterId: '',
};
