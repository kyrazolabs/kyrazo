import { SubscriptionResponse } from '@/modules/billing/subscriptions/subscription.dto';

import { IPlan, IPlanSnapshot, transformWithId } from '@kyrazo/shared';

export class SubscriptionTransformer {
    private static instance: SubscriptionTransformer;

    constructor() {}

    public static getInstance(): SubscriptionTransformer {
        if (!SubscriptionTransformer.instance) {
            SubscriptionTransformer.instance = new SubscriptionTransformer();
        }
        return SubscriptionTransformer.instance;
    }

    public transformToResponse(subscription: any): SubscriptionResponse {
        return transformWithId(subscription, 'subscription') as any;
    }
}

export const subscriptionTransformer = SubscriptionTransformer.getInstance();

export function snapshot(plan: IPlan): IPlanSnapshot {
    return {
        planId: plan._id,
        name: plan.name,
        slug: plan.slug,

        priceCents: plan.priceCents,
        currency: plan.currency,
        interval: plan.interval,

        features: plan.features || {},
        limits: {
            eventsPerSecond: plan.limits?.eventsPerSecond ?? 10,
            eventsPerMonth: plan.limits?.eventsPerMonth ?? 1000,
            maxNamespaces: plan.limits?.maxNamespaces ?? 1,
            maxMembers: plan.limits?.maxMembers ?? 1,
            maxConnectors: plan.limits?.maxConnectors ?? 1,
            maxIntegrations: plan.limits?.maxIntegrations ?? 1,
            maxWorkers: plan.limits?.maxWorkers ?? 1,
        },
        benefits: plan.benefits || [],

        stripeProductId: plan.stripeProductId,
        stripePriceId: plan.stripePriceId,
        createdAt: new Date(),
    };
}
