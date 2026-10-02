import Stripe from 'stripe';
import { Types } from 'mongoose';
import { stripe, stripeConfig } from '@/configs/stripe';
import { redisConfig } from '@/configs';
import { paymentRepository } from './payment.repo';
import { subscriptionService } from '@/modules/v1/billing/subscriptions/subscription.service';
import { Invoice, logger, unprefixId, RedisKeys } from '@kyrazo/shared';
import { subscriptionRepository } from '@/modules/v1/billing/subscriptions/subscription.repo';
import { planRepository } from '@/modules/v1/billing/plans/plan.repo';
import { snapshot } from '@/core/utils/transformers';
import { limitService } from '@/shared/services/limit.service';

export class PaymentService {
    private async saveInvoiceFromStripe(
        stripeInvoice: any,
        workspaceId: string,
        subscriptionId: string
    ) {
        try {
            await Invoice.create({
                stripeInvoiceId: stripeInvoice.id,
                workspaceId: new Types.ObjectId(unprefixId(workspaceId)),
                subscriptionId: new Types.ObjectId(unprefixId(subscriptionId)),
                amountDue: stripeInvoice.amount_due,
                amountPaid: stripeInvoice.amount_paid,
                currency: stripeInvoice.currency,
                status: stripeInvoice.status,
                periodStart: new Date(stripeInvoice.period_start * 1000),
                periodEnd: new Date(stripeInvoice.period_end * 1000),
                lines: stripeInvoice.lines.data.map((l: any) => ({
                    description: l.description,
                    amount: l.amount,
                    quantity: l.quantity,
                    period: {
                        start: new Date(l.period.start * 1000),
                        end: new Date(l.period.end * 1000),
                    },
                })),
                pdfUrl: stripeInvoice.invoice_pdf,
                hostedInvoiceUrl: stripeInvoice.hosted_invoice_url,
            });
            logger.info(`Saved local invoice for Stripe Invoice ${stripeInvoice.id}`);
        } catch (error: any) {
            logger.error(`Failed to save local invoice: ${error}`);
        }
    }

    async createBillingPortalSession(
        workspaceId: string,
        returnUrl: string
    ): Promise<{ url: string }> {
        // Get customer
        const customer = await paymentRepository.findCustomerByWorkspace(workspaceId);
        if (!customer) {
            throw new Error('No Stripe customer found for this workspace');
        }

        // Create billing portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: customer.stripeCustomerId,
            return_url: returnUrl,
        });

        return { url: session.url };
    }

    async createRenewalInvoice(
        workspaceId: string,
        subscriptionId: string,
        items: Array<{
            amount: number;
            description: string;
            metadata?: Record<string, string>;
        }>
    ): Promise<Stripe.Invoice> {
        const customer = await paymentRepository.findCustomerByWorkspace(workspaceId);
        if (!customer) {
            throw new Error('No Stripe customer found for this workspace');
        }

        // 1. Create Invoice (Draft)
        const invoice = await stripe.invoices.create({
            customer: customer.stripeCustomerId,
            collection_method: 'charge_automatically',
            auto_advance: true,
            metadata: {
                subscriptionId,
                workspaceId,
                type: 'renewal',
            },
            payment_settings: {
                payment_method_types: ['card'],
            },
        });

        // 2. Create Invoice Items (Attached to Invoice)
        for (const item of items) {
            await stripe.invoiceItems.create({
                customer: customer.stripeCustomerId,
                invoice: invoice.id, // Explicit attachment
                amount: item.amount,
                currency: 'usd',
                description: item.description,
                metadata: {
                    ...item.metadata,
                    subscriptionId,
                    workspaceId,
                },
            });
        }

        // 3. Finalize
        const finalized = await stripe.invoices.finalizeInvoice(invoice.id!);

        // Save to DB
        await this.saveInvoiceFromStripe(finalized, workspaceId, subscriptionId);

        return finalized as any;
    }

    async processWebhook(rawBody: Buffer, signature: string): Promise<void> {
        try {
            // Verify source signature
            const event = await stripe.webhooks.constructEventAsync(
                rawBody,
                signature,
                stripeConfig.sourceSecret
            );

            // Check if we've already processed this event
            const existingEvent = await paymentRepository.findWebhookEvent(event.id);
            if (existingEvent) {
                logger.info(`Webhook event ${event.id} already processed`);
                return;
            }

            // Process the event
            await this.handleWebhookEvent(event);

            // Record that we've processed this event
            await paymentRepository.recordWebhookEvent(event.id, event.type);

            logger.info(`Successfully processed source event: ${event.type}`);
        } catch (error: any) {
            logger.error('Webhook processing error:', error);
            throw error;
        }
    }

    private async handleWebhookEvent(event: Stripe.Event): Promise<void> {
        switch (event.type) {
            case 'checkout.session.completed':
                await this.onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
                break;

            case 'invoice.paid':
                await this.onInvoicePaid(event.data.object as Stripe.Invoice);
                break;

            case 'invoice.payment_failed':
                await this.onInvoicePaymentFailed(event.data.object as Stripe.Invoice);
                break;

            case 'customer.subscription.deleted':
                await this.onSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.updated':
                await this.onSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;

            default:
                logger.debug(`Unhandled event: ${event.type}`);
        }
    }

    private async onCheckoutCompleted(session: Stripe.Checkout.Session) {
        if (!session.subscription) {
            logger.warn('Checkout completed without subscription');
            return;
        }

        const stripeSubscriptionId = session.subscription as string;

        // idempotency: لا تنشئ مرتين
        const existing = await subscriptionRepository.findByStripeId(stripeSubscriptionId);
        if (existing) return;

        const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);

        const priceId = stripeSub.items.data[0].price.id;
        const plan = await planRepository.getPlanByStripePrice(priceId);

        if (!plan) {
            logger.error(
                'Plan that called by id from checkout.session.completed webhook does not exists'
            );
            return;
        }

        // Deactivate any existing active subscriptions for this workspace (e.g. the default Free plan)
        const workspaceId = session.metadata!.workspaceId;
        await subscriptionRepository.deactivateOtherSubscriptions(workspaceId);

        await subscriptionRepository.create({
            workspaceId: new Types.ObjectId(unprefixId(session.metadata!.workspaceId)),
            userId: new Types.ObjectId(unprefixId(session.metadata!.userId)),
            planId: plan?._id,
            planSnapshot: snapshot(plan),
            stripeSubscriptionId,
            status: stripeSub.status,
            currentPeriodStart: new Date(stripeSub.items.data[0].current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.items.data[0].current_period_end * 1000),
            billingCycleAnchor: new Date(stripeSub.billing_cycle_anchor * 1000),
            quantity: stripeSub.items.data[0].quantity ?? 1,
        });

        await limitService.invalidateWorkspaceLimits(session.metadata!.workspaceId);
    }

    private async onInvoicePaid(invoice: Stripe.Invoice) {
        if (!invoice.parent?.subscription_details?.subscription) return;

        const stripeSubscriptionId = invoice.parent.subscription_details.subscription as string;

        const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);

        const priceId = stripeSub.items.data[0].price.id;
        const plan = await planRepository.getPlanByStripePrice(priceId);
        if (!plan) {
            logger.error('Plan that called by id from invoice.paid webhook does not exists');
            return;
        }

        await subscriptionRepository.updateByStripeId(stripeSubscriptionId, {
            status: stripeSub.status,
            planId: plan._id,
            planSnapshot: snapshot(plan),
            currentPeriodStart: new Date(stripeSub.items.data[0].current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.items.data[0].current_period_end * 1000),
            paymentFailureCount: 0,
        });
    }

    private async onInvoicePaymentFailed(invoice: Stripe.Invoice) {
        if (!invoice.parent?.subscription_details?.subscription) return;

        await subscriptionRepository.incrementFailure(
            invoice.parent?.subscription_details?.subscription as string
        );
    }

    async onSubscriptionDeleted(subscription: Stripe.Subscription) {
        // Update local status
        await subscriptionRepository.updateByStripeId(subscription.id, {
            status: 'canceled',
            canceledAt: new Date(),
        });

        let workspaceId = subscription.metadata.workspaceId;
        let userId = subscription.metadata.userId;

        // Fallback: If metadata is missing, look up in our database
        if (!workspaceId || !userId) {
            const localSub = await subscriptionRepository.findByStripeId(subscription.id);
            if (localSub) {
                workspaceId = localSub.workspaceId.toString();
                userId = localSub.userId.toString();
            }
        }

        // Revert to free plan if we found the workspace
        if (workspaceId && userId) {
            await subscriptionService.revertToFreePlan(workspaceId, userId);
            logger.info(`Reverted workspace ${workspaceId} to free plan after Stripe deletion`);
        } else {
            logger.warn(
                `Could not revert to free plan: Missing workspace/user for sub ${subscription.id}`
            );
        }
    }

    private async onSubscriptionUpdated(stripeSub: Stripe.Subscription) {
        const stripeSubscriptionId = stripeSub.id;

        const existing = await subscriptionRepository.findByStripeId(stripeSubscriptionId);
        if (!existing) {
            logger.warn(
                `Subscription update received for unknown subscription: ${stripeSubscriptionId}`
            );
            return;
        }

        const priceId = stripeSub.items.data[0].price.id;
        const plan = await planRepository.getPlanByStripePrice(priceId);

        if (!plan) {
            logger.error(
                `Plan for price ID ${priceId} from customer.subscription.updated webhook does not exist`
            );
            return;
        }

        await subscriptionRepository.updateByStripeId(stripeSubscriptionId, {
            planId: plan._id,
            planSnapshot: snapshot(plan),
            status: stripeSub.status,
            currentPeriodStart: new Date(stripeSub.items.data[0].current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.items.data[0].current_period_end * 1000),
            billingCycleAnchor: new Date(stripeSub.billing_cycle_anchor * 1000),
            quantity: stripeSub.items.data[0].quantity ?? 1,
            canceledAt: stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000) : undefined,
        });

        // If it was just canceled (not deletion, but status change to canceled for some reason)
        if (stripeSub.status === 'canceled') {
            await subscriptionService.revertToFreePlan(
                existing.workspaceId.toString(),
                existing.userId.toString()
            );
            logger.info(
                `Reverted workspace ${existing.workspaceId} to free plan after cancellation update`
            );
        }

        await limitService.invalidateWorkspaceLimits(existing.workspaceId.toString());
        await redisConfig.del(RedisKeys.billing.workspacePlan(existing.workspaceId.toString()));
    }

    private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
        const subscriptionId = session.metadata?.subscriptionId;
        if (!subscriptionId) {
            logger.warn('Checkout session completed without subscription ID');
            return;
        }

        // Activate the subscription
        await subscriptionService.activateSubscription(subscriptionId);

        logger.info(`Activated subscription ${subscriptionId} after successful checkout`);
    }

    private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
        logger.info(`Invoice payment succeeded: ${invoice.id}`);

        // Update local invoice status
        try {
            await Invoice.updateOne(
                { stripeInvoiceId: invoice.id },
                {
                    status: 'paid',
                    amountPaid: invoice.amount_paid,
                    pmdUrl: invoice.invoice_pdf,
                    hostedInvoiceUrl: invoice.hosted_invoice_url,
                }
            );
        } catch (err: any) {
            logger.error(`Failed to update local invoice status to paid: ${err}`);
        }

        const subscriptionId = invoice.metadata?.subscriptionId;
        if (subscriptionId) {
            await subscriptionService.activateSubscription(subscriptionId);
            // Also update payment failure count reset?
            // subscriptionService.resetFailureCount? (Not implemented yet, but good to have)
        }
    }

    private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
        logger.info(`Invoice payment failed: ${invoice.id}`);

        // Update local invoice status
        try {
            await Invoice.updateOne(
                { stripeInvoiceId: invoice.id },
                {
                    status: invoice.status || 'open', // maintain open or past_due equivalence
                    amountPaid: invoice.amount_paid,
                }
            );
        } catch (err: any) {
            logger.error(`Failed to update local invoice status on failure: ${err}`);
        }

        const subscriptionId = invoice.metadata?.subscriptionId;
        if (subscriptionId) {
            await subscriptionService.updateSubscriptionStatus(subscriptionId, 'past_due');
        }
    }

    // Legacy handlers removed or no-op
    // private async handleSubscriptionUpdated...
    // private async handleSubscriptionDeleted...
}

export const paymentService = new PaymentService();
