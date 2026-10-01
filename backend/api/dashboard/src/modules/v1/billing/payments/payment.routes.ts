import { Hono } from 'hono';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { CreateBillingPortalDto } from './payment.dto';
import { PaymentController } from './payment.controller';
import { paymentReadRateLimiter } from './payment.ratelimiter';
import { validate } from '@/core/middlewares/validator.middleware';

const payment = new Hono();

// Authenticated routes
payment.use('/portal', authenticate);
payment.use('/portal', requireWorkspaceMembership());

// Public webhook route (no auth needed, uses Stripe signature verification)
payment.post('/webhook', PaymentController.handleWebhook);

// Create billing portal session
payment.post(
    '/portal',
    paymentReadRateLimiter,
    validate('json', CreateBillingPortalDto),
    PaymentController.createBillingPortal
);

export default payment;
