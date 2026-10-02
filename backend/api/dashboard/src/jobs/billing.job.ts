import { subscriptionRepository } from '@/modules/v1/billing/subscriptions/subscription.repo';
import { subscriptionService } from '@/modules/v1/billing/subscriptions/subscription.service';
import { paymentService } from '@/modules/v1/billing/payments/payment.service';
import { planService } from '@/modules/v1/billing/plans/plan.service';
import { usageService } from '@/shared/services/usage.service';
import { logger } from '@kyrazo/shared';

export class BillingJob {
    /**
     * Run the billing job to renew subscriptions and calculate overages.
     * Should be scheduled to run hourly or daily.
     */
    async run(): Promise<void> {
        logger.info('Starting Billing Job...');
        try {
            // 1. Find subscriptions due for renewal
            const dueSubscriptions = await subscriptionRepository.findSubscriptionsDueForRenewal();

            logger.info(`Found ${dueSubscriptions.length} subscriptions due for renewal.`);

            for (const subscription of dueSubscriptions) {
                try {
                    await this.renewSubscription(subscription);
                } catch (error: any) {
                    logger.error(`Failed to renew subscription ${subscription._id}`, error);
                    // Continue to next subscription
                }
            }
        } catch (error: any) {
            logger.error('Billing Job failed (fatal)', error);
        }
        logger.info('Billing Job finished.');
    }

    private async renewSubscription(subscription: any): Promise<void> {
        // any for now to avoid strict typing issues with ISubscription if imports vary, but preferably typed
        const subId = subscription._id.toString();
        const workspaceId = subscription.workspaceId.toString();

        logger.info(`Renewing subscription ${subId} (Workspace: ${workspaceId})`);

        // 2. Get Plan
        const plan = await planService.getPlanById(subscription.planId.toString());
        if (!plan) {
            logger.error(`Plan not found for subscription ${subId}`);
            return;
        }

        // 3. Get Usage for the ending period
        // We assume periodStart matches the billing cycle month start for usage aggregation
        const usageCount = await usageService.getMonthlyUsage(
            subId,
            subscription.currentPeriodStart
        );
        logger.info(
            `Usage for ${subId}: ${usageCount} events (Period: ${subscription.currentPeriodStart.toISOString()})`
        );

        // 4. Calculate Overage
        const limit = plan.limits.eventsPerMonth;
        const overageCount = Math.max(0, usageCount - limit);
        let overageAmount = 0;

        const items: Array<{
            amount: number;
            description: string;
            metadata?: Record<string, string>;
        }> = [];

        if (overageCount > 0) {
            const overagePrice = plan.overagePriceCents || 0;
            overageAmount = overageCount * overagePrice;
            if (overageAmount > 0) {
                items.push({
                    amount: overageAmount,
                    description: `Overage: ${overageCount} events (Limit: ${limit})`,
                    metadata: {
                        type: 'overage',
                        eventCount: usageCount.toString(),
                        limit: limit.toString(),
                    },
                });
            }
        }

        // 5. Add Base Plan for NEXT period
        // We bill in advance for the base plan
        items.push({
            amount: plan.priceCents,
            description: `Renewal: ${plan.name} (Next Period)`,
            metadata: {
                type: 'base',
                planId: plan._id.toString(),
            },
        });

        // 6. Create Invoice
        const invoice = await paymentService.createRenewalInvoice(workspaceId, subId, items);

        logger.info(`Created renewal invoice ${invoice.id} for subscription ${subId}`);

        // 7. Update Subscription Dates
        const now = new Date();
        const currentEnd = new Date(subscription.currentPeriodEnd);
        // Default to +1 month from currentEnd to keep alignment
        // If currentEnd is far in past, we might need to catch up or reset
        // For simplicity: newStart = oldEnd, newEnd = oldEnd + 1 month
        const nextPeriodStart = currentEnd;
        const nextPeriodEnd = new Date(nextPeriodStart);
        nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

        await subscriptionRepository.updateById(subId, {
            currentPeriodStart: nextPeriodStart,
            currentPeriodEnd: nextPeriodEnd,
            lastInvoiceId: invoice.id!,
            status: 'past_due', // Mark as past_due until payment is confirmed
            // We assume successful processing or Stripe retry logic checks status
            // If payment failed immediately, source will mark past_due
        });

        logger.info(
            `Updated subscription ${subId} period to ${nextPeriodStart.toISOString()} - ${nextPeriodEnd.toISOString()}`
        );
    }
}

export const billingJob = new BillingJob();
