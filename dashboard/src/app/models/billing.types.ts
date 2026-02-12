// Subscription and Billing Types

export interface IPlan {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price?: number;
    priceCents?: number; // Backend uses cents
    currency: string;
    frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: 'month' | 'year'; // Backend uses interval
    features: any; // Mixed object
    limits: any; // Mixed object
    trialDays?: number;
    isActive: boolean;
    isPopular?: boolean;
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
    planSnapshot?: any;
    createdAt: string;
    updatedAt: string;
}

export interface SubscriptionResponse extends ISubscription {
    paypalApprovalUrl?: string; // For PayPal redirect
}

export interface CreateSubscriptionRequest {
    planId: string;
    trialDays?: number;
}

export interface BillingHistoryItem {
    id: string;
    date: string;
    description: string;
    amount: number;
    status: 'paid' | 'pending' | 'failed' | 'overdue';
    invoiceUrl?: string;
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
