import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { AppContext, authenticate } from '@/core/middlewares/auth.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { config } from '@/configs/app';
import {
    createSlidingWindowLimiter,
    createRateLimitMiddleware,
} from '@/core/middlewares/rate-limiter.middleware';
import {
    CreateSubscriptionPaymentDto,
    CreateBillingPortalDto,
} from './payment.dto';
import { PaymentController } from './payment.controller';

const payment = new Hono();

// Rate limiters
const paymentReadRateLimiter = async (
    c: AppContext,
    next: () => Promise<void>
) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.protected.normal.points,
            duration: config.security.rateLimiter.protected.normal.duration,
            blockDuration:
                config.security.rateLimiter.protected.normal.blockDuration,
        }),
        c =>
            config.security.rateLimiter.protected.normal.keyPrefix(
                (c as any).user.userId
            ),
        'Too many payment read requests'
    );
    return limiter(c, next);
};

const paymentWriteRateLimiter = async (
    c: AppContext,
    next: () => Promise<void>
) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.protected.medium.points,
            duration: config.security.rateLimiter.protected.medium.duration,
            blockDuration:
                config.security.rateLimiter.protected.medium.blockDuration,
        }),
        c =>
            config.security.rateLimiter.protected.medium.keyPrefix(
                (c as any).user.userId
            ),
        'Too many payment write requests'
    );
    return limiter(c, next);
};

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
