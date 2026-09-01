export interface PricingPlan {
    name: string;
    slug: string;
    description: string;
    priceCentsMonthly: number;
    priceCentsYearly: number;
    currency: string;
    /** e.g. "Annual contract required" or "Custom billing" */
    commitment?: string;
    /** Display note next to the price, e.g. "$1,000–$5,000+ / month" */
    priceNote?: string;
    features: {
        workers: number | string;
        ingest: boolean;
        dispatch: boolean;
        support: string;
        sla: string;
        analytics: string;
        retentionDays: number | string;
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
        isolatedDatabase?: boolean;
        byoc?: boolean;
        customCompliance?: boolean;
    };
    limits: {
        eventsPerSecond: number | string;
        eventsPerMonth: number | string;
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
 * Kyrazo Pricing Plans - Sales-Led Enterprise Strategy
 *
 * The platform has moved from self-serve tiers to a sales-led enterprise
 * model. Both plans are contracted through a discovery call with sales:
 *
 * - Professional: $499/mo on an annual contract. Fully dedicated, isolated
 *   compute & database infrastructure with isolated delivery workers.
 *   14-day enterprise trial option available.
 * - Enterprise: Custom billing ($1,000–$5,000+/mo). BYOC / private cloud
 *   deployment, custom SLAs with 24/7 priority support, custom compliance.
 *
 * A one-time onboarding and security setup fee ($500–$1,500) applies to all
 * new dedicated deployments.
 */

export const PROFESSIONAL_PLAN: PricingPlan = {
    name: 'Professional',
    slug: 'professional',
    description:
        'A fully dedicated Kyrazo environment — your own compute, database, and delivery workers. Nothing shared, ever.',
    priceCentsMonthly: 49900,
    priceCentsYearly: 598800,
    currency: 'USD',
    commitment: 'Annual contract required',
    features: {
        workers: 'Dedicated',
        ingest: true,
        dispatch: true,
        support: 'Priority support',
        sla: '99.9% Uptime SLA',
        analytics: 'Full analytics dashboard',
        retentionDays: 90,
        customHeaders: true,
        customTimeout: true,
        customRetries: true,
        forwardConfiguration: true,
        apiAccess: true,
        batchProcessing: true,
        dedicatedInfrastructure: true,
        isolatedDatabase: true,
    },
    limits: {
        eventsPerSecond: 'Custom',
        eventsPerMonth: 'Custom',
        maxProjects: -1,
        maxMembers: -1,
        maxConnectors: -1,
        maxIntegrations: -1,
        maxWorkers: -1,
    },
    benefits: [
        'Fully dedicated, isolated compute & database infrastructure',
        'Isolated delivery workers',
        '14-day enterprise trial option',
        'Automatic retries with exponential backoff',
        'Signature verification & payload normalization',
        'Priority support',
    ],
    isActive: true,
    overagePriceCents: 0,
    meterId: '',
    highlighted: true,
    tag: 'Most Popular',
};

export const ENTERPRISE_PLAN: PricingPlan = {
    name: 'Enterprise',
    slug: 'enterprise',
    description:
        'Run Kyrazo in your own cloud or a private deployment, with SLAs, support, and compliance tailored to your organization.',
    priceCentsMonthly: 0,
    priceCentsYearly: 0,
    currency: 'USD',
    commitment: 'Custom billing',
    priceNote: '$1,000–$5,000+ / month',
    features: {
        workers: 'Custom',
        ingest: true,
        dispatch: true,
        support: '24/7 priority support',
        sla: 'Custom Uptime SLA',
        analytics: 'Custom dashboards & raw data export',
        retentionDays: 'Custom',
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
        isolatedDatabase: true,
        byoc: true,
        customCompliance: true,
        sso: true,
    },
    limits: {
        eventsPerSecond: 'Custom',
        eventsPerMonth: 'Custom',
        maxProjects: -1,
        maxMembers: -1,
        maxConnectors: -1,
        maxIntegrations: -1,
        maxWorkers: -1,
    },
    benefits: [
        'Bring Your Own Cloud (BYOC) / Private Cloud deployment',
        'Custom SLAs & 24/7 priority support',
        'Custom compliance setup',
        'SAML/SSO & advanced security controls',
        'Custom data retention & analytics',
        'Dedicated account team',
    ],
    isActive: true,
    overagePriceCents: 0,
    meterId: '',
    tag: 'Private Cloud',
};
