import { Types, Model, Document } from 'mongoose';

// Plan Types
export interface IPlanLimits {
    eventsPerSecond: number;
    eventsPerMonth: number;
    maxProjects: number;
    maxMembers: number;
    maxConnectors: number;
    maxIntegrations: number;
    maxConcurrent: number;
}

export interface IPlan extends Document {
    _id: Types.ObjectId;
    name: string;
    slug: string;
    description?: string;
    priceCents: number;
    currency: string;
    interval: 'month' | 'year';
    overagePriceCents?: number;
    features: Record<string, any>;
    limits: IPlanLimits;
    stripeProductId: string;
    stripePriceId: string;
    stripeMeteredPriceId?: string;
    stripeMeterId?: string;
    stripeMeterEventName?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IPlanModel extends Model<IPlan> {
    findBySlug(slug: string): Promise<IPlan>;
    findActivePlans(): Promise<IPlan[]>;
}

// Subscription Types
export interface IPlanSnapshot {
    planId: Types.ObjectId;
    name: string;
    slug: string;
    priceCents: number;
    currency: string;
    interval: 'month' | 'year';
    features: Record<string, unknown>;
    limits: IPlanLimits;
    stripeProductId: string;
    stripePriceId: string;
    stripeMeteredPriceId?: string;
    stripeMeterId?: string;
    stripeMeterEventName?: string;

    createdAt: Date;
}

export interface ISubscription {
    _id: Types.ObjectId;
    workspaceId: Types.ObjectId;
    userId: Types.ObjectId;
    planId: Types.ObjectId;
    planSnapshot: IPlanSnapshot;
    status:
        | 'active'
        | 'canceled'
        | 'incomplete'
        | 'incomplete_expired'
        | 'past_due'
        | 'paused'
        | 'trialing'
        | 'unpaid';
    stripeSubscriptionId?: string;
    billingCycleAnchor: Date;
    lastInvoiceId?: string;
    paymentFailureCount: number;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    trialEnd?: Date;
    quantity: number;
    metadata?: Record<string, unknown>;
    canceledAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ISubscriptionModel extends Model<ISubscription> {
    findByWorkspace(workspaceId: string): Promise<ISubscription[]>;
    findActiveByWorkspace(workspaceId: string): Promise<ISubscription | null>;
}

// Customer Types
export interface ICustomer {
    _id: Types.ObjectId;
    workspaceId: Types.ObjectId;
    userId: Types.ObjectId;
    stripeCustomerId: string;
    email: string;
    name?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICustomerModel extends Model<ICustomer> {
    findByWorkspace(workspaceId: string): Promise<ICustomer | null>;
    findByStripeCustomerId(stripeCustomerId: string): Promise<ICustomer | null>;
}

// Invoice Types
export interface IInvoice {
    _id: Types.ObjectId;
    stripeInvoiceId?: string;
    subscriptionId?: Types.ObjectId;
    workspaceId: Types.ObjectId;
    amountDue: number;
    amountPaid: number;
    currency: string;
    status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
    periodStart?: Date;
    periodEnd?: Date;
    lines: Array<{
        description: string;
        amount: number;
        quantity: number;
        period?: {
            start: Date;
            end: Date;
        };
    }>;
    pdfUrl?: string;
    hostedInvoiceUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IInvoiceModel extends Model<IInvoice> {
    findByWorkspace(workspaceId: string, limit?: number): Promise<IInvoice[]>;
    findBySubscription(subscriptionId: string): Promise<IInvoice[]>;
}

// Usage Types
export interface IUsage {
    _id: Types.ObjectId;
    workspaceId: Types.ObjectId;
    subscriptionId: Types.ObjectId;
    meteredSubscriptionItemId: string;
    stripeMeterEventName: string;
    eventType: string;
    count: number;
    periodStart: Date;
    periodEnd: Date;
    aggregatedAt: Date;
    reported: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUsageModel extends Model<IUsage> {
    aggregateUsage(
        workspaceId: string,
        periodStart: Date,
        periodEnd: Date
    ): Promise<IUsage[]>;
    bulkInsert(usages: Partial<IUsage>[]): Promise<IUsage[]>;
}

// Webhook Events Processed Types
export interface IWebhookEventProcessed {
    _id: Types.ObjectId;
    eventId: string;
    eventType: string;
    processedAt: Date;
    createdAt: Date;
}

export interface IWebhookEventProcessedModel extends IWebhookEventProcessed {
    findByEventId(eventId: string): Promise<IWebhookEventProcessed | null>;
}
