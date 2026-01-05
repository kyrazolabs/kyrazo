import Stripe from 'stripe';
import { Types } from 'mongoose';
import { stripe, stripeConfig } from '@/configs/stripe';
import { paymentRepository } from './payment.repo';
import { subscriptionService } from '../subscriptions/subscription.service';
import { planService } from '../plans/plan.service';
import { CreateSubscriptionPaymentInput, PaymentResponse } from './payment.dto';
import { logger } from '@/configs';
import { Invoice, Plan } from '@kyrazo/shared';
import { subscriptionRepository } from '../subscriptions/subscription.repo';
import { planRepository } from '../plans/plan.repo';
import { snapshot } from '@/core/utils/transformers';
import { limitService } from '@/shared/services/limit.service';
import { usageService } from '@/shared/services/usage.service';

export class PaymentService {
    private async saveInvoiceFromStripe(
        stripeInvoice: any,
        workspaceId: string,
        subscriptionId: string
    ) {
        try {
            await Invoice.create({
                stripeInvoiceId: stripeInvoice.id,
                workspaceId: new Types.ObjectId(workspaceId),
                subscriptionId: new Types.ObjectId(subscriptionId),
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
            logger.info(
                `Saved local invoice for Stripe Invoice ${stripeInvoice.id}`
            );
        } catch (error) {
            logger.error(`Failed to save local invoice: ${error}`);
        }
    }
    async createInitialPayment(
        workspaceId: string,
        userId: string,
        userEmail: string,
        input: CreateSubscriptionPaymentInput
    ): Promise<PaymentResponse> {
        // Get plan details
        const plan = await planService.getPlanById(input.planId);
        if (!plan) {
            throw new Error('Plan not found');
        }
        logger.info(
            `Creating subscription for plan: ${plan.name} (${plan._id}), Price: ${plan.priceCents} ${plan.currency}`
        );

        // Get or create Stripe customer
        let customer =
            await paymentRepository.findCustomerByWorkspace(workspaceId);
        if (!customer) {
            const stripeCustomer = await stripe.customers.create({
                email: userEmail,
                metadata: {
                    workspaceId,
                    userId,
                },
            });

            customer = await paymentRepository.createCustomer({
                workspaceId: new Types.ObjectId(workspaceId),
                userId: new Types.ObjectId(userId),
                stripeCustomerId: stripeCustomer.id,
                email: userEmail,
                name: stripeCustomer.name || undefined,
            });
        }

        // Create subscription in our system (incomplete status)
        // Create subscription in our system (incomplete status)
        const subscription = await subscriptionService.createSubscription(
            workspaceId,
            userId,
            {
                planId: plan._id.toString(),
                quantity: input.quantity,
            }
        );

        // 1. Create Invoice (Empty Draft)
        const invoice = await stripe.invoices.create({
            customer: customer.stripeCustomerId,
            collection_method: 'charge_automatically',
            auto_advance: true,
            metadata: {
                subscriptionId: subscription._id.toString(),
                workspaceId,
            },
            payment_settings: {
                payment_method_types: ['card'],
            },
        });

        // 2. Create Invoice Item (Attached to Invoice)
        await stripe.invoiceItems.create({
            customer: customer.stripeCustomerId,
            invoice: invoice.id, // Explicitly attach to this invoice
            amount: plan.priceCents,
            currency: plan.currency,
            description: `Subscription to ${plan.name}`,
            metadata: {
                subscriptionId: subscription._id.toString(),
                workspaceId,
            },
        });

        // Finalize invoice to get payment intent
        let finalizedInvoiceResponse = await stripe.invoices.finalizeInvoice(
            invoice.id!,
            { expand: ['payment_intent'] }
        );
        let finalizedInvoice = finalizedInvoiceResponse as any;

        // Poll for PaymentIntent if missing (up to 3 times)
        let attempts = 0;
        while (
            !finalizedInvoice.payment_intent &&
            finalizedInvoice.status === 'open' &&
            attempts < 3
        ) {
            attempts++;
            logger.warn(
                `PaymentIntent missing, attempt ${attempts}/3. Waiting 1s...`
            );
            await new Promise(resolve => setTimeout(resolve, 1000));

            finalizedInvoiceResponse = await stripe.invoices.retrieve(
                invoice.id!,
                {
                    expand: ['payment_intent'],
                }
            );
            finalizedInvoice = finalizedInvoiceResponse as any;
        }

        if (!finalizedInvoice.payment_intent) {
            logger.error(
                `Failed to get PaymentIntent after retries. Invoice dump: ${JSON.stringify(finalizedInvoice)}`
            );
        }

        logger.info(
            `Finalized Invoice: ${finalizedInvoice.id}, Status: ${finalizedInvoice.status}, Amount: ${finalizedInvoice.amount_due}, PaymentIntent: ${typeof finalizedInvoice.payment_intent}`
        );
        logger.info(
            `Finalized Invoice: ${finalizedInvoice.id}, Status: ${finalizedInvoice.status}, Amount: ${finalizedInvoice.amount_due}, PaymentIntent: ${typeof finalizedInvoice.payment_intent}`
        );

        if (finalizedInvoice.payment_intent) {
            const piId =
                typeof finalizedInvoice.payment_intent === 'string'
                    ? finalizedInvoice.payment_intent
                    : finalizedInvoice.payment_intent.id;
            const pi = await stripe.paymentIntents.retrieve(piId);

            // Save Invoice to DB
            await this.saveInvoiceFromStripe(
                finalizedInvoice,
                workspaceId,
                subscription._id.toString()
            );

            return {
                subscriptionId: subscription._id.toString(),
                clientSecret: pi.client_secret!,
                invoiceId: finalizedInvoice.id,
                hostedInvoiceUrl: finalizedInvoice.hosted_invoice_url,
            };
        }

        // Fallback: Return Hosted Invoice URL if PI is still missing
        if (finalizedInvoice.hosted_invoice_url) {
            logger.warn(
                `Returning Hosted Invoice URL as fallback for missing PI`
            );
            // Save Invoice to DB
            await this.saveInvoiceFromStripe(
                finalizedInvoice,
                workspaceId,
                subscription._id.toString()
            );

            return {
                subscriptionId: subscription._id.toString(),
                clientSecret: '', // Frontend should handle empty secret by redirecting to hostedUrl
                invoiceId: finalizedInvoice.id,
                hostedInvoiceUrl: finalizedInvoice.hosted_invoice_url,
            };
        }

        throw new Error(
            `Failed to generate payment intent or hosted URL. Invoice status: ${finalizedInvoice.status}`
        );
    }

    async createBillingPortalSession(
        workspaceId: string,
        returnUrl: string
    ): Promise<{ url: string }> {
        // Get customer
        const customer =
            await paymentRepository.findCustomerByWorkspace(workspaceId);
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
        const customer =
            await paymentRepository.findCustomerByWorkspace(workspaceId);
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
        await this.saveInvoiceFromStripe(
            finalized,
            workspaceId,
            subscriptionId
        );

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
            const existingEvent = await paymentRepository.findWebhookEvent(
                event.id
            );
            if (existingEvent) {
                logger.info(`Webhook event ${event.id} already processed`);
                return;
            }
            logger.debug(JSON.stringify(event));

            // Process the event
            await this.handleWebhookEvent(event);

            // Record that we've processed this event
            await paymentRepository.recordWebhookEvent(event.id, event.type);

            logger.info(`Successfully processed source event: ${event.type}`);
        } catch (error) {
            logger.error('Webhook processing error:', error as Error);
            throw error;
        }
    }

    private async handleWebhookEvent(event: Stripe.Event): Promise<void> {
        switch (event.type) {
            case 'checkout.session.completed':
                await this.onCheckoutCompleted(
                    event.data.object as Stripe.Checkout.Session
                );
                break;

            case 'invoice.paid':
                await this.onInvoicePaid(event.data.object as Stripe.Invoice);
                break;

            case 'invoice.payment_failed':
                await this.onInvoicePaymentFailed(
                    event.data.object as Stripe.Invoice
                );
                break;

            case 'customer.subscription.deleted':
                await this.onSubscriptionDeleted(
                    event.data.object as Stripe.Subscription
                );
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
        const existing =
            await subscriptionRepository.findByStripeId(stripeSubscriptionId);
        if (existing) return;

        const stripeSub =
            await stripe.subscriptions.retrieve(stripeSubscriptionId);

        const priceId = stripeSub.items.data[0].price.id;
        const plan = await planRepository.getPlanByStripePrice(priceId);

        if (!plan) {
            logger.error(
                'Plan that called by id from checkout.session.completed webhook does not exists'
            );
            return;
        }

        await subscriptionRepository.create({
            workspaceId: new Types.ObjectId(session.metadata!.workspaceId),
            userId: new Types.ObjectId(session.metadata!.userId),
            planId: plan?._id,
            planSnapshot: snapshot(plan),
            stripeSubscriptionId,
            status: stripeSub.status,
            currentPeriodStart: new Date(
                stripeSub.items.data[0].current_period_start * 1000
            ),
            currentPeriodEnd: new Date(
                stripeSub.items.data[0].current_period_end * 1000
            ),
            billingCycleAnchor: new Date(stripeSub.billing_cycle_anchor * 1000),
            quantity: stripeSub.items.data[0].quantity ?? 1,
        });

        await limitService.invalidateWorkspaceLimits(
            session.metadata!.workspaceId
        );
    }

    private async onInvoicePaid(invoice: Stripe.Invoice) {
        if (!invoice.parent?.subscription_details?.subscription) return;

        const stripeSubscriptionId = invoice.parent.subscription_details
            .subscription as string;

        const stripeSub =
            await stripe.subscriptions.retrieve(stripeSubscriptionId);

        const priceId = stripeSub.items.data[0].price.id;
        const plan = await planRepository.getPlanByStripePrice(priceId);
        if (!plan) {
            logger.error(
                'Plan that called by id from invoice.paid webhook does not exists'
            );
            return;
        }

        await subscriptionRepository.updateByStripeId(stripeSubscriptionId, {
            status: stripeSub.status,
            planId: plan._id,
            planSnapshot: snapshot(plan),
            currentPeriodStart: new Date(
                stripeSub.items.data[0].current_period_start * 1000
            ),
            currentPeriodEnd: new Date(
                stripeSub.items.data[0].current_period_end * 1000
            ),
            paymentFailureCount: 0,
        });
    }

    private async onInvoicePaymentFailed(invoice: Stripe.Invoice) {
        if (!invoice.parent?.subscription_details?.subscription) return;

        await subscriptionRepository.incrementFailure(
            invoice.parent?.subscription_details?.subscription as string
        );
    }

    private async onSubscriptionDeleted(subscription: Stripe.Subscription) {
        await subscriptionRepository.updateByStripeId(subscription.id, {
            status: 'canceled',
            canceledAt: new Date(),
        });
    }

    private async handleCheckoutSessionCompleted(
        session: Stripe.Checkout.Session
    ): Promise<void> {
        const subscriptionId = session.metadata?.subscriptionId;
        if (!subscriptionId) {
            logger.warn('Checkout session completed without subscription ID');
            return;
        }

        // Activate the subscription
        await subscriptionService.activateSubscription(subscriptionId);

        logger.info(
            `Activated subscription ${subscriptionId} after successful checkout`
        );
    }

    private async handleInvoicePaymentSucceeded(
        invoice: Stripe.Invoice
    ): Promise<void> {
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
        } catch (err) {
            logger.error(
                `Failed to update local invoice status to paid: ${err}`
            );
        }

        const subscriptionId = invoice.metadata?.subscriptionId;
        if (subscriptionId) {
            await subscriptionService.activateSubscription(subscriptionId);
            // Also update payment failure count reset?
            // subscriptionService.resetFailureCount? (Not implemented yet, but good to have)
        }
    }

    private async handleInvoicePaymentFailed(
        invoice: Stripe.Invoice
    ): Promise<void> {
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
        } catch (err) {
            logger.error(
                `Failed to update local invoice status on failure: ${err}`
            );
        }

        const subscriptionId = invoice.metadata?.subscriptionId;
        if (subscriptionId) {
            await subscriptionService.updateSubscriptionStatus(
                subscriptionId,
                'past_due'
            );
        }
    }

    // Legacy handlers removed or no-op
    // private async handleSubscriptionUpdated...
    // private async handleSubscriptionDeleted...
}

export const paymentService = new PaymentService();
