import { subscriptionRepository } from './subscription.repo';
import { planService } from '@/modules/billing/plans/plan.service';
import { ISubscription, IPlanSnapshot, User, Customer, unprefixId, Invoice } from '@kyrazo/shared';
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
import { snapshot } from '@/core/utils/transformers';
import { subscriptionCacheService } from '@/shared/services/subscription-cache.service';

export class SubscriptionService {
    async createSubscriptionCheckout(
        workspaceId: string,
        userId: string,
        subscriptionData: CreateSubscriptionInput
    ) {
        const plan = await planService.getPlanById(subscriptionData.planId);
        if (!plan) throw new Error('Plan not found');

        const existing = await subscriptionRepository.findActiveByWorkspace(workspaceId);
        if (existing && existing.planSnapshot.slug !== 'free') {
            throw new Error('Workspace already has an active subscription');
        }

        const user = await User.findById(unprefixId(userId));
        if (!user) throw new Error('User not found');

        let customer = await Customer.findOne({ userId: unprefixId(userId) });
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
                // Only add metered price if Stripe Checkout can handle it (same interval)
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

    async createSubscription(
        workspaceId: string,
        userId: string,
        subscriptionData: { planId: string; quantity?: number }
    ): Promise<ISubscription> {
        const plan = await planService.getPlanById(subscriptionData.planId);
        if (!plan) throw new Error('Plan not found');

        const now = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const subscription = await subscriptionRepository.create({
            workspaceId: new Types.ObjectId(unprefixId(workspaceId)),
            userId: new Types.ObjectId(unprefixId(userId)),
            planId: plan._id,
            planSnapshot: snapshot(plan),
            status: 'incomplete', // Will be activated via webhook or success
            quantity: subscriptionData.quantity ?? 1,
            billingCycleAnchor: now,
            currentPeriodStart: now,
            currentPeriodEnd: nextMonth,
        });

        await limitService.invalidateWorkspaceLimits(workspaceId);
        return subscription;
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

    async getSubscriptionWithCache(workspaceId: string): Promise<ISubscription | null> {
        const cached = await subscriptionCacheService.get(workspaceId);
        if (cached) return cached;

        const subscription = await this.getActiveWorkspaceSubscription(workspaceId);
        if (subscription) {
            await subscriptionCacheService.set(workspaceId, subscription);
        }
        return subscription;
    }

    async getWorkspaceSubscriptionWithFallback(workspaceId: string): Promise<any> {
        const subscription = await subscriptionRepository.findActiveByWorkspace(workspaceId);

        if (subscription) {
            return subscription;
        }

        return await this.createVirtualFreeSubscription(workspaceId);
    }

    async getWorkspaceSubscriptionsWithFallback(workspaceId: string): Promise<any[]> {
        const subscriptions = await subscriptionRepository.findByWorkspace(workspaceId);

        if (subscriptions.length > 0) {
            return subscriptions;
        }

        // Fallback to history with virtual free plan
        const virtualSub = await this.createVirtualFreeSubscription(workspaceId);
        return [virtualSub];
    }

    private async createVirtualFreeSubscription(workspaceId: string): Promise<any> {
        // Fallback to free plan
        const freePlan = await planService.getPlanBySlug('free');
        if (!freePlan) {
            throw new Error('Free plan not found');
        }

        const now = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        // Return a virtual subscription object that looks like ISubscription
        return {
            _id: new Types.ObjectId(),
            workspaceId: new Types.ObjectId(unprefixId(workspaceId)),
            planId: freePlan._id,
            planSnapshot: snapshot(freePlan),
            status: 'active',
            billingCycleAnchor: now,
            paymentFailureCount: 0,
            currentPeriodStart: now,
            currentPeriodEnd: nextMonth,
            quantity: 1,
            createdAt: now,
            updatedAt: now,
            isVirtual: true,
        };
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

        // 1️⃣ Update Stripe if it exists
        if (subscription.stripeSubscriptionId) {
            const stripeSub = await stripe.subscriptions.retrieve(
                subscription.stripeSubscriptionId
            );
            const itemId = stripeSub.items.data[0].id;

            await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
                items: [
                    {
                        id: itemId,
                        price: newPlan.stripePriceId,
                        quantity: changeData.quantity ?? subscription.quantity,
                    },
                ],
                proration_behavior: 'always_invoice',
            });
        }

        // Create new plan snapshot
        const newPlanSnapshot = snapshot(newPlan);

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
            await subscriptionCacheService.set(
                updatedSubscription.workspaceId.toString(),
                updatedSubscription
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
            // Schedule cancellation at end of billing period — no refund involved
            if (subscription.stripeSubscriptionId) {
                await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
                    cancel_at_period_end: true,
                });
            }
            updateData.metadata = {
                ...subscription.metadata,
                cancelAtPeriodEnd: true,
                cancelReason: cancelData.reason,
            };
        } else {
            // Immediate cancellation — enforce one-time refund policy
            const hasRefundHistory = await subscriptionRepository.hasWorkspaceEverReceivedRefund(
                subscription.workspaceId.toString()
            );

            if (hasRefundHistory) {
                // FALLBACK: If refund already used, gracefully fallback to cancel at period end
                if (subscription.stripeSubscriptionId) {
                    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
                        cancel_at_period_end: true,
                    });
                }
                updateData.status = 'active'; // Stay active until period ends
                updateData.metadata = {
                    ...subscription.metadata,
                    cancelAtPeriodEnd: true,
                    cancelReason: cancelData.reason,
                    refundSkipped: true, // Flag for frontend to notice the user
                };
            } else {
                // Issue Stripe refund and cancel the subscription
                if (subscription.stripeSubscriptionId) {
                    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
                }

                // Stamp refundIssuedAt to permanently prevent future refunds for this workspace
                updateData.refundIssuedAt = new Date();
            }
        }

        const updatedSubscription = await subscriptionRepository.updateById(
            subscriptionId,
            updateData
        );

        if (updatedSubscription) {
            await limitService.invalidateWorkspaceLimits(
                updatedSubscription.workspaceId.toString()
            );

            if (!cancelData.cancelAtPeriodEnd) {
                await this.revertToFreePlan(
                    updatedSubscription.workspaceId.toString(),
                    updatedSubscription.userId.toString()
                );
            }
        }
        return updatedSubscription;
    }

    async revertToFreePlan(workspaceId: string, userId: string): Promise<ISubscription> {
        const freePlan = await planService.getPlanBySlug('free');
        if (!freePlan) {
            throw new Error('Free plan not found');
        }

        // Deactivate any existing active subscriptions
        await subscriptionRepository.deactivateOtherSubscriptions(workspaceId);

        const now = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const subscription = await subscriptionRepository.create({
            workspaceId: new Types.ObjectId(unprefixId(workspaceId)),
            userId: new Types.ObjectId(unprefixId(userId)),
            planId: freePlan._id,
            planSnapshot: snapshot(freePlan),
            status: 'active',
            billingCycleAnchor: now,
            currentPeriodStart: now,
            currentPeriodEnd: nextMonth,
            quantity: 1,
        });

        await limitService.invalidateWorkspaceLimits(workspaceId);
        return subscription;
    }

    async activateSubscription(subscriptionId: string): Promise<ISubscription | null> {
        const updatedSubscription = await subscriptionRepository.updateById(subscriptionId, {
            status: 'active',
        });
        if (updatedSubscription) {
            await limitService.invalidateWorkspaceLimits(
                updatedSubscription.workspaceId.toString()
            );
            await subscriptionCacheService.set(
                updatedSubscription.workspaceId.toString(),
                updatedSubscription
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
            await subscriptionCacheService.set(
                updatedSubscription.workspaceId.toString(),
                updatedSubscription
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
            await subscriptionCacheService.set(
                updatedSubscription.workspaceId.toString(),
                updatedSubscription
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

    async getInvoices(workspaceId: string): Promise<any[]> {
        return await Invoice.find({
            workspaceId: new Types.ObjectId(unprefixId(workspaceId)),
        })
            .sort({ createdAt: -1 })
            .limit(20);
    }

    async checkWorkspaceLimits(workspaceId: string): Promise<{
        canCreate: boolean;
        currentUsage: {
            eventsPerSecond: number;
            eventsPerMonth: number;
            maxNamespaces: number;
            maxMembers: number;
            maxConnectors: number;
            maxIntegrations: number;
            maxWorkers: number;
        };
        limits: {
            eventsPerSecond: number;
            eventsPerMonth: number;
            maxNamespaces: number;
            maxMembers: number;
            maxConnectors: number;
            maxIntegrations: number;
            maxWorkers: number;
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
                    maxNamespaces: 0,
                    maxMembers: 0,
                    maxConnectors: 0,
                    maxIntegrations: 0,
                    maxWorkers: 0,
                },
                limits: {
                    eventsPerSecond: 10,
                    eventsPerMonth: 1000,
                    maxNamespaces: 1,
                    maxMembers: 1,
                    maxConnectors: 1,
                    maxIntegrations: 1,
                    maxWorkers: 1,
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
            maxNamespaces: 0,
            maxMembers: 0,
            maxConnectors: 0,
            maxIntegrations: 0,
            maxWorkers: 0,
        };

        return {
            canCreate: true,
            currentUsage,
            limits: subscription.planSnapshot.limits,
        };
    }

    async verifyCheckoutSession(sessionId: string): Promise<{
        status: string;
        workspaceId?: string;
        userId?: string;
        subscriptionId?: string;
    }> {
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        return {
            status: session.status || 'unknown',
            workspaceId: session.metadata?.workspaceId,
            userId: session.metadata?.userId,
            subscriptionId: session.subscription as string,
        };
    }
}

export const subscriptionService = new SubscriptionService();
