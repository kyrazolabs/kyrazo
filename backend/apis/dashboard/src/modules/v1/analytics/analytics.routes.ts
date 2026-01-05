import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { AppContext, authenticate } from '@/core/middlewares/auth.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { requireProjectAccess } from '@/core/middlewares/project.middleware';
import { config } from '@/configs/app';
import {
    createSlidingWindowLimiter,
    createRateLimitMiddleware,
} from '@/core/middlewares/rate-limiter.middleware';
import { AnalyticsController } from '@/modules/v1/analytics/analytics.controller';
import {
    OverviewFilterSchema,
    ProjectHeadersSchema,
    TargetQuerySchema,
} from '@/core/utils/libs/zod';

const analytics = new Hono();

// Header validation using zValidator
const validateProjectHeaders = zValidator(
    'header',
    ProjectHeadersSchema,
    (result, c) => {
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
    }
);

// Lazy wrapper for analytics routes rate limiter (user-based, normal level for read operations)
const analyticsRateLimiter = async (
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
        'Too many analytics requests'
    );
    return limiter(c, next);
};

analytics.use('*', authenticate);
analytics.use('*', validateProjectHeaders);
analytics.use('*', requireWorkspaceMembership(['owner', 'admin', 'member']));
analytics.use('*', requireProjectAccess());

/**
 * @title Get Dispatch Statistics
 */
analytics.get(
    '/dispatch/usage',
    analyticsRateLimiter,
    zValidator('query', OverviewFilterSchema, (result, c) => {
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
    AnalyticsController.getDispatchUsage
);

/**
 * @title Get Ingest Statistics
 */
analytics.get(
    '/ingest/usage',
    analyticsRateLimiter,
    zValidator('query', OverviewFilterSchema, (result, c) => {
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
    AnalyticsController.getIngestUsage
);

/**
 * @title Get by Target stats
 */
analytics.get(
    '/targets/:target/overview',
    analyticsRateLimiter,
    zValidator('param', TargetQuerySchema, (result, c) => {
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
    zValidator('query', OverviewFilterSchema, (result, c) => {
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
    AnalyticsController.getTargetOverview
);

export default analytics;
