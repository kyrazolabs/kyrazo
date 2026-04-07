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
import { DeliveryController } from '@/modules/v1/delivery/delivery.controller';
import {
    GetDeliveriesBySourceIdSchema,
    GetDeliveriesBySourceSchema,
    GetDeliveriesSchema,
    GetDeliveryByIdSchema,
    OverviewFilterSchema,
    TargetQuerySchema,
} from './delivery.schema';
import { NamespaceHeadersSchema } from '@/core/utils/libs/zod';

const delivery = new Hono();

// Header validation using zValidator
const validateNamespaceHeaders = zValidator('header', NamespaceHeadersSchema);

// Lazy wrapper for delivery routes rate limiter (user-based, normal level for read operations)
const deliveryRateLimiter = async (c: AppContext, next: () => Promise<void>) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.protected.normal.points,
            duration: config.security.rateLimiter.protected.normal.duration,
            blockDuration: config.security.rateLimiter.protected.normal.blockDuration,
        }),
        c => config.security.rateLimiter.protected.normal.keyPrefix((c as any).user.userId),
        'Too many delivery requests'
    );
    return limiter(c, next);
};

delivery.use('*', authenticate);
delivery.use('*', sentryMiddleware);
delivery.use('*', validateNamespaceHeaders);
delivery.use('*', requireWorkspaceMembership(['owner', 'admin', 'member']));
delivery.use('*', requireNamespaceAccess());

/**
 * @title Get All Deliveries
 */
delivery.get(
    '/',
    deliveryRateLimiter,
    zValidator('query', GetDeliveriesSchema),
    DeliveryController.getDeliveries
);

/**
 * @title Get Endpoints
 */
delivery.get(
    '/targets',
    deliveryRateLimiter,
    zValidator('query', GetDeliveriesSchema.omit({ status: true })),
    DeliveryController.getTargets
);

/**
 * @title Get by Target
 */
delivery.get(
    '/targets/:targetId',
    deliveryRateLimiter,
    zValidator('param', TargetQuerySchema),
    zValidator('query', GetDeliveriesSchema),
    DeliveryController.getDeliveriesByTarget
);

/**
 * @title Get by Target stats
 */
delivery.get(
    '/targets/:targetId/overview',
    deliveryRateLimiter,
    zValidator('param', TargetQuerySchema),
    zValidator('query', OverviewFilterSchema),
    DeliveryController.getDeliveryStatsByTarget
);

/**
 * @title Get All Deliveries of specific source
 */
delivery.get(
    '/source/:sourceId',
    deliveryRateLimiter,
    zValidator('param', GetDeliveriesBySourceIdSchema),
    zValidator('query', GetDeliveriesBySourceSchema),
    DeliveryController.getDeliveriesBySource
);

/**
 * @title Get a specific delivery log
 */
delivery.get(
    '/:deliveryId',
    deliveryRateLimiter,
    zValidator('param', GetDeliveryByIdSchema),
    DeliveryController.getDeliveryById
);

export default delivery;
