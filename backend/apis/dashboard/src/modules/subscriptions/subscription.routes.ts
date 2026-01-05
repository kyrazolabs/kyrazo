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
    CreateSubscriptionDto,
    ChangePlanDto,
    CancelSubscriptionDto,
} from './subscription.dto';
import { SubscriptionController } from './subscription.controller';

const subscription = new Hono();

// Middleware
subscription.use('*', authenticate);
subscription.use('*', requireWorkspaceMembership());

// Rate limiters
const subscriptionReadRateLimiter = async (
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
        'Too many subscription read requests'
    );
    return limiter(c, next);
};

const subscriptionWriteRateLimiter = async (
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
        'Too many subscription write requests'
    );
    return limiter(c, next);
};

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
    '/limits',
    subscriptionReadRateLimiter,
    SubscriptionController.checkLimits
);

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

export default subscription;
