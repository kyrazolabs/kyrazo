// Subscription and Billing Types

export interface IPlanFeatures {
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
    ipWhitelisting?: boolean;
    whiteLabelHeaders?: boolean;
    customSla?: boolean;
    customDomain?: boolean;
    dedicatedInfrastructure?: boolean;
    sso?: boolean;
}

export interface IPlanLimits {
    eventsPerSecond: number;
    eventsPerMonth: number;
    maxNamespaces: number;
    maxMembers: number;
    maxConnectors: number;
    maxIntegrations: number;
    maxWorkers: number;
    webhooks?: number;
    maxTokens?: number;
}

export interface IPlan {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price?: number;
    priceCents?: number;
    currency: string;
    frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: 'month' | 'year';
    features: IPlanFeatures;
    limits: IPlanLimits;
    trialDays?: number;
    isActive: boolean;
    isPopular?: boolean;
}

export interface IPlanSnapshot extends Omit<
    IPlan,
    'isActive' | 'isPopular' | 'trialDays'
> {
    planId: string;
}

export interface ISubscription {
    id: string;
    userId: string;
    planId: string;
    status:
        | 'active'
        | 'cancelled'
        | 'expired'
        | 'past_due'
        | 'trialing'
        | 'incomplete';
    startDate: string;
    endDate?: string;
    trialEndDate?: string;
    nextBillingDate?: string;
    autoRenew: boolean;
    paymentMethod?: {
        type: 'paypal' | 'stripe' | 'bank_transfer';
        paypalEmail?: string;
    };
    currentPeriodStart: string;
    currentPeriodEnd: string;
    plan?: IPlan;
    planSnapshot?: IPlanSnapshot;
    createdAt: string;
    updatedAt: string;
    isVirtual?: boolean;
    hostedInvoiceUrl?: string;
    checkoutUrl?: string;
    clientSecret?: string;
    stripeSubscriptionId?: string;
}

export interface SubscriptionResponse extends ISubscription {
    paypalApprovalUrl?: string;
}

export interface CreateSubscriptionRequest {
    planId: string;
    trialDays?: number;
}

export interface UsageStats {
    webhooksUsed: number;
    endpointsUsed: number;
    deliveriesThisMonth: number;
    apiCallsThisMonth: number;
    storageUsedGB: number;
    successRate: number;
}

export interface BillingInfo {
    nextAmount: number;
    nextDue: string;
    totalSaved: number;
    currency: string;
}

export interface PaymentMethod {
    type: 'paypal' | 'stripe' | 'bank_transfer';
    brand?: string;
    last4?: string;
    expMonth?: string;
    expYear?: string;
    paypalEmail?: string;
    isDefault: boolean;
}
