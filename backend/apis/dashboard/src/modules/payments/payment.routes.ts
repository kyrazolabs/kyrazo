import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { CreateSubscriptionPaymentDto, CreateBillingPortalDto } from './payment.dto';
import { PaymentController } from './payment.controller';
import { paymentReadRateLimiter, paymentWriteRateLimiter } from './payment.ratelimiter';

const payment = new Hono();

// Authenticated routes
payment.use('/subscribe', authenticate);
payment.use('/subscribe', requireWorkspaceMembership());
payment.use('/portal', authenticate);
payment.use('/portal', requireWorkspaceMembership());

// Public webhook route (no auth needed, uses Stripe signature verification)
payment.post('/webhook', PaymentController.handleWebhook);

// Create subscription (initial payment)
payment.post(
    '/subscribe',
    paymentWriteRateLimiter,
    zValidator('json', CreateSubscriptionPaymentDto, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: JSON.parse(result.error.message).map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
    }),
    PaymentController.createSubscription
);

// Create billing portal session
payment.post(
    '/portal',
    paymentReadRateLimiter,
    zValidator('json', CreateBillingPortalDto, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: JSON.parse(result.error.message).map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
    }),
    PaymentController.createBillingPortal
);

export default payment;
