import { subscriptionRepository } from './subscription.repo';
import { planService } from '../plans/plan.service';
import { ISubscription, IPlanSnapshot, User, Customer, unprefixId } from '@kyrazo/shared';
import {
    CreateSubscriptionInput,
    ChangePlanInput,
    CancelSubscriptionInput,
} from './subscription.dto';
import { Types } from 'mongoose';
import { limitService } from '@/shared/services/limit.service';
import { usageService } from '@/shared/services/usage.service';
import { stripe } from '@/configs/stripe';
import { config } from '@/configs';

export class SubscriptionService {
    async createSubscriptionCheckout(
        workspaceId: string,
        userId: string,
        subscriptionData: CreateSubscriptionInput
    ) {
        const plan = await planService.getPlanById(subscriptionData.planId);
        if (!plan) throw new Error('Plan not found');

        const existing = await subscriptionRepository.findActiveByWorkspace(workspaceId);
        if (existing) {
            throw new Error('Workspace already has an active subscription');
        }

        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        let customer = await Customer.findOne({ userId });
        if (!customer) {
            const stripeCustomer = await stripe.customers.create({
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
                metadata: { userId, workspaceId },
            });

            customer = await Customer.create({
                userId: unprefixId(userId),
                workspaceId: unprefixId(workspaceId),
                stripeCustomerId: stripeCustomer.id,
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
            });
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customer.stripeCustomerId,
            line_items: [
                {
                    price: plan.stripePriceId,
                    quantity: subscriptionData.quantity ?? 1,
                },
                ...(plan.stripeMeteredPriceId ? [{ price: plan.stripeMeteredPriceId }] : []),
            ],
            success_url: `${config.stripe.baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${config.stripe.baseUrl}/billing/cancel`,
            metadata: {
                userId,
                workspaceId,
                planId: plan._id.toString(),
            },
            subscription_data: {
                metadata: {
                    workspaceId,
                },
            },
        });

        return {
            checkoutUrl: session.url,
        };
    }

    async getSubscriptionById(id: string): Promise<ISubscription | null> {
        return await subscriptionRepository.findById(id);
    }

    async getWorkspaceSubscriptions(workspaceId: string): Promise<ISubscription[]> {
        return await subscriptionRepository.findByWorkspace(workspaceId);
    }

    async getActiveWorkspaceSubscription(workspaceId: string): Promise<ISubscription | null> {
        return await subscriptionRepository.findActiveByWorkspace(workspaceId);
    }

    async changePlan(
        subscriptionId: string,
        changeData: ChangePlanInput
    ): Promise<ISubscription | null> {
        const subscription = await subscriptionRepository.findById(subscriptionId);
        if (!subscription) {
            throw new Error('Subscription not found');
        }

        if (subscription.status !== 'active') {
            throw new Error('Can only change plan for active subscriptions');
        }

        // Get new plan
        const newPlan = await planService.getPlanById(changeData.planId);
        if (!newPlan) {
            throw new Error('New plan not found');
        }

        // Create new plan snapshot
        const newPlanSnapshot: IPlanSnapshot = {
            planId: newPlan._id,
            name: newPlan.name,
            slug: newPlan.slug,
            priceCents: newPlan.priceCents,
            currency: newPlan.currency,
            interval: newPlan.interval,
            features: newPlan.features,
            limits: newPlan.limits,
            stripeProductId: newPlan.stripeProductId,
            stripePriceId: newPlan.stripePriceId,
            stripeMeteredPriceId: newPlan.stripeMeteredPriceId,
            stripeMeterId: newPlan.stripeMeterId,
            stripeMeterEventName: newPlan.stripeMeterEventName,
            createdAt: new Date(),
        };

        // Update subscription
        const updateData: Partial<ISubscription> = {
            planId: newPlan._id,
            planSnapshot: newPlanSnapshot,
        };

        if (changeData.quantity) {
            updateData.quantity = changeData.quantity;
        }

        const updatedSubscription = await subscriptionRepository.updateById(
            subscriptionId,
            updateData
        );
        if (updatedSubscription) {
            await limitService.invalidateWorkspaceLimits(
                updatedSubscription.workspaceId.toString()
            );
        }
        return updatedSubscription;
    }

    async cancelSubscription(
        subscriptionId: string,
        cancelData: CancelSubscriptionInput
    ): Promise<ISubscription | null> {
        const subscription = await subscriptionRepository.findById(subscriptionId);
        if (!subscription) {
            throw new Error('Subscription not found');
        }

        const updateData: Partial<ISubscription> = {
            status: cancelData.cancelAtPeriodEnd ? 'active' : 'canceled',
            canceledAt: new Date(),
        };

        if (cancelData.cancelAtPeriodEnd) {
            // Will be canceled at period end by a job
            updateData.metadata = {
                ...subscription.metadata,
                cancelAtPeriodEnd: true,
                cancelReason: cancelData.reason,
            };
        }

        const updatedSubscription = await subscriptionRepository.updateById(
            subscriptionId,
            updateData
        );
        if (updatedSubscription) {
            await limitService.invalidateWorkspaceLimits(
                updatedSubscription.workspaceId.toString()
            );
        }
        return updatedSubscription;
    }

    async activateSubscription(subscriptionId: string): Promise<ISubscription | null> {
        const updatedSubscription = await subscriptionRepository.updateById(subscriptionId, {
            status: 'active',
        });
        if (updatedSubscription) {
            await limitService.invalidateWorkspaceLimits(
                updatedSubscription.workspaceId.toString()
            );
        }
        return updatedSubscription;
    }

    async updateSubscriptionStatus(
        subscriptionId: string,
        status: ISubscription['status']
    ): Promise<ISubscription | null> {
        const updatedSubscription = await subscriptionRepository.updateById(subscriptionId, {
            status,
        });
        if (updatedSubscription) {
            await limitService.invalidateWorkspaceLimits(
                updatedSubscription.workspaceId.toString()
            );
        }
        return updatedSubscription;
    }

    async updateSubscriptionByStripeId(
        stripeSubscriptionId: string,
        updateData: Partial<ISubscription>
    ): Promise<ISubscription | null> {
        const updatedSubscription = await subscriptionRepository.updateByStripeId(
            stripeSubscriptionId,
            updateData
        );
        if (updatedSubscription) {
            await limitService.invalidateWorkspaceLimits(
                updatedSubscription.workspaceId.toString()
            );
        }
        return updatedSubscription;
    }

    async getExpiringTrials(hoursFromNow: number = 24): Promise<ISubscription[]> {
        return await subscriptionRepository.findExpiringTrials(hoursFromNow);
    }

    async getEndingSubscriptions(hoursFromNow: number = 24): Promise<ISubscription[]> {
        return await subscriptionRepository.findEndingSubscriptions(hoursFromNow);
    }

    async checkWorkspaceLimits(workspaceId: string): Promise<{
        canCreate: boolean;
        currentUsage: {
            eventsPerSecond: number;
            eventsPerMonth: number;
            maxProjects: number;
            maxMembers: number;
            maxConnectors: number;
            maxIntegrations: number;
            maxConcurrent: number;
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
    }> {
        const subscription = await subscriptionRepository.findActiveByWorkspace(workspaceId);

        if (!subscription) {
            // No subscription, use free tier limits
            return {
                canCreate: false,
                currentUsage: {
                    eventsPerSecond: 0,
                    eventsPerMonth: 0,
                    maxProjects: 0,
                    maxMembers: 0,
                    maxConnectors: 0,
                    maxIntegrations: 0,
                    maxConcurrent: 0,
                },
                limits: {
                    eventsPerSecond: 10,
                    eventsPerMonth: 1000,
                    maxProjects: 1,
                    maxMembers: 1,
                    maxConnectors: 1,
                    maxIntegrations: 1,
                    maxConcurrent: 1,
                },
            };
        }

        const currentMonthUsage = await usageService.getMonthlyUsage(
            subscription._id.toString(),
            new Date()
        );

        const currentUsage = {
            eventsPerSecond: 0, // We don't have real-time RPS tracking here yet, but we can default to 0 or use Redis
            eventsPerMonth: currentMonthUsage,
            maxProjects: 0,
            maxMembers: 0,
            maxConnectors: 0,
            maxIntegrations: 0,
            maxConcurrent: 0,
        };

        return {
            canCreate: true,
            currentUsage,
            limits: subscription.planSnapshot.limits,
        };
    }
}

export const subscriptionService = new SubscriptionService();
