import { Hono } from 'hono';
import { zValidator } from '@/core/middlewares/validator.middleware';
import { AppContext, authenticate } from '@/core/middlewares/auth.middleware';
import { sentryMiddleware } from '@/core/middlewares/sentry.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { requireNamespaceAccess } from '@/core/middlewares/namespace.middleware';
import { config } from '@/configs/app';
import {
    createSlidingWindowLimiter,
    createRateLimitMiddleware,
} from '@/core/middlewares/rate-limiter.middleware';
import { AnalyticsController } from '@/modules/v1/analytics/analytics.controller';
import { OverviewFilterSchema, TargetQuerySchema } from './analytics.schema';
import { NamespaceHeadersSchema } from '@/core/utils/libs/zod';

const analytics = new Hono();

// Header validation using zValidator
const validateNamespaceHeaders = zValidator('header', NamespaceHeadersSchema);

// Lazy wrapper for analytics routes rate limiter (user-based, normal level for read operations)
const analyticsRateLimiter = async (c: AppContext, next: () => Promise<void>) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.protected.normal.points,
            duration: config.security.rateLimiter.protected.normal.duration,
            blockDuration: config.security.rateLimiter.protected.normal.blockDuration,
        }),
        c => config.security.rateLimiter.protected.normal.keyPrefix((c as any).user.userId),
        'Too many analytics requests'
    );
    return limiter(c, next);
};

analytics.use('*', authenticate);
analytics.use('*', sentryMiddleware);
analytics.use('*', validateNamespaceHeaders);
analytics.use('*', requireWorkspaceMembership(['owner', 'admin', 'member']));
analytics.use('*', requireNamespaceAccess());

/**
 * @title Get Dispatch Statistics
 */
analytics.get(
    '/dispatch/usage',
    analyticsRateLimiter,
    zValidator('query', OverviewFilterSchema),
    AnalyticsController.getDispatchUsage
);

/**
 * @title Get Ingest Statistics
 */
analytics.get(
    '/ingest/usage',
    analyticsRateLimiter,
    zValidator('query', OverviewFilterSchema),
    AnalyticsController.getIngestUsage
);

/**
 * @title Get by Target stats
 */
analytics.get(
    '/targets/:targetId/overview',
    analyticsRateLimiter,
    zValidator('param', TargetQuerySchema),
    zValidator('query', OverviewFilterSchema),
    AnalyticsController.getTargetOverview
);

export default analytics;
