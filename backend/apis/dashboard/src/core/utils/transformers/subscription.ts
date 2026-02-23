import { SubscriptionResponse } from '@/shared/types';
import { IPlan, IPlanSnapshot } from '@kyrazo/shared';

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
        return {
            id: subscription._id.toString(),
            userId: subscription.userId.toString(),
            planId: subscription.planId.toString(),
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            trialEndDate: subscription.trialEndDate,
            nextBillingDate: subscription.nextBillingDate,
            autoRenew: subscription.autoRenew,
            paymentMethod: subscription.paymentMethod,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            plan: subscription.plan
                ? {
                      id: subscription.plan._id.toString(),
                      name: subscription.plan.name,
                      price: subscription.plan.price,
                      currency: subscription.plan.currency,
                      frequency: subscription.plan.frequency,
                      limits: subscription.plan.limits,
                      benefits: subscription.plan.benefits,
                      features: subscription.plan.features,
                  }
                : undefined,
            createdAt: subscription.createdAt,
            updatedAt: subscription.updatedAt,
        };
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
            maxProjects: plan.limits?.maxProjects ?? 1,
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
