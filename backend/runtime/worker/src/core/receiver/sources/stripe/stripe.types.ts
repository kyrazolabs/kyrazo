export interface StripeWebhookEvent<TData = any> {
    id: string;
    object: "event";
    api_version: string | null;
    created: number;
    data: {
        object: TData;
        previous_attributes?: Partial<TData>;
    };
    livemode: boolean;
    pending_webhooks: number;
    request: {
        id: string | null;
        idempotency_key: string | null;
    } | null;
    type: string;
}

export type StripeEventType =
    // Checkout
    | "checkout.session.async_payment_failed"
    | "checkout.session.async_payment_succeeded"
    | "checkout.session.completed"
    | "checkout.session.expired"

    // Charge
    | "charge.captured"
    | "charge.expired"
    | "charge.failed"
    | "charge.pending"
    | "charge.refunded"
    | "charge.succeeded"
    | "charge.updated"
    | "charge.dispute.closed"
    | "charge.dispute.created"
    | "charge.dispute.funds_reinstated"
    | "charge.dispute.funds_withdrawn"
    | "charge.dispute.updated"
    | "charge.refund.updated"

    // Customer
    | "customer.created"
    | "customer.deleted"
    | "customer.updated"
    | "customer.discount.created"
    | "customer.discount.deleted"
    | "customer.discount.updated"
    | "customer.source.created"
    | "customer.source.deleted"
    | "customer.source.expiring"
    | "customer.source.updated"
    | "customer.subscription.created"
    | "customer.subscription.deleted"
    | "customer.subscription.pending_update_applied"
    | "customer.subscription.pending_update_expired"
    | "customer.subscription.trial_will_end"
    | "customer.subscription.updated"
    | "customer.tax_id.created"
    | "customer.tax_id.deleted"
    | "customer.tax_id.updated"

    // Invoice
    | "invoice.created"
    | "invoice.deleted"
    | "invoice.finalization_failed"
    | "invoice.finalized"
    | "invoice.marked_uncollectible"
    | "invoice.paid"
    | "invoice.payment_action_required"
    | "invoice.payment_failed"
    | "invoice.payment_succeeded"
    | "invoice.sent"
    | "invoice.upcoming"
    | "invoice.updated"
    | "invoice.voided"

    // Payment Intent
    | "payment_intent.amount_capturable_updated"
    | "payment_intent.canceled"
    | "payment_intent.created"
    | "payment_intent.partially_funded"
    | "payment_intent.payment_failed"
    | "payment_intent.processing"
    | "payment_intent.requires_action"
    | "payment_intent.succeeded"

    // Setup Intent
    | "setup_intent.canceled"
    | "setup_intent.created"
    | "setup_intent.requires_action"
    | "setup_intent.setup_failed"
    | "setup_intent.succeeded"

    // Subscription Schedule
    | "subscription_schedule.aborted"
    | "subscription_schedule.canceled"
    | "subscription_schedule.completed"
    | "subscription_schedule.created"
    | "subscription_schedule.expiring"
    | "subscription_schedule.released"
    | "subscription_schedule.updated"

    // Plan & Product
    | "plan.created"
    | "plan.deleted"
    | "plan.updated"
    | "product.created"
    | "product.deleted"
    | "product.updated"

    // Fallback
    | (string & {});
