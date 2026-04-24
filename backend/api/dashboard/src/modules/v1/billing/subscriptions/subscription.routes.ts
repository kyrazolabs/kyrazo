import { z } from 'zod';
import { Hono } from 'hono';
import { authenticate, requireOwnership } from '@/core/middlewares/auth.middleware';
import { sentryMiddleware } from '@/core/middlewares/sentry.middleware';
import { validate } from '@/core/middlewares/validator.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { CreateSubscriptionDto, ChangePlanDto, CancelSubscriptionDto } from './subscription.dto';
import { SubscriptionController } from './subscription.controller';
import {
    subscriptionWriteRateLimiter,
    subscriptionReadRateLimiter,
} from './subscription.ratelimiter';

const subscription = new Hono();

// Middleware
subscription.use('*', authenticate);
subscription.use('*', sentryMiddleware);
subscription.use('*', requireWorkspaceMembership());
// Routes
subscription.post(
    '/',
    subscriptionWriteRateLimiter,
    validate('json', CreateSubscriptionDto),
    SubscriptionController.createSubscription
);

subscription.get(
    '/',
    subscriptionReadRateLimiter,
    SubscriptionController.getWorkspaceSubscriptions
);

subscription.get(
    '/history',
    subscriptionReadRateLimiter,
    SubscriptionController.getWorkspaceSubscriptions
);

subscription.get('/invoices', subscriptionReadRateLimiter, SubscriptionController.getInvoices);

subscription.get('/limits', subscriptionReadRateLimiter, SubscriptionController.checkLimits);

subscription.get(
    '/:id',
    subscriptionReadRateLimiter,
    validate('param', z.object({ id: z.string() })),
    SubscriptionController.getSubscription
);

subscription.post(
    '/:id/change-plan',
    subscriptionWriteRateLimiter,
    validate('param', z.object({ id: z.string() })),
    validate('json', ChangePlanDto),
    SubscriptionController.changePlan
);

subscription.post(
    '/:id/cancel',
    subscriptionWriteRateLimiter,
    validate('param', z.object({ id: z.string() })),
    validate('json', CancelSubscriptionDto),
    SubscriptionController.cancelSubscription
);

subscription.get(
    '/checkout/verify',
    subscriptionReadRateLimiter,
    SubscriptionController.verifyCheckoutSession
);

export default subscription;
