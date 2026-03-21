import { z } from 'zod';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authenticate, requireOwnership } from '@/core/middlewares/auth.middleware';
import { sentryMiddleware } from '@/core/middlewares/sentry.middleware';
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
    zValidator('json', CreateSubscriptionDto, (result, c) => {
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
    zValidator('param', z.object({ id: z.string() }), (result, c) => {
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
    SubscriptionController.getSubscription
);

subscription.post(
    '/:id/change-plan',
    subscriptionWriteRateLimiter,
    zValidator('param', z.object({ id: z.string() }), (result, c) => {
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
    zValidator('json', ChangePlanDto, (result, c) => {
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
    SubscriptionController.changePlan
);

subscription.post(
    '/:id/cancel',
    subscriptionWriteRateLimiter,
    zValidator('param', z.object({ id: z.string() }), (result, c) => {
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
    zValidator('json', CancelSubscriptionDto, (result, c) => {
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
    SubscriptionController.cancelSubscription
);

subscription.get(
    '/checkout/verify',
    subscriptionReadRateLimiter,
    SubscriptionController.verifyCheckoutSession
);

export default subscription;
