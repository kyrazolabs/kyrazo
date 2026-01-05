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
import { DeliveryController } from '@/modules/v1/delivery/delivery.controller';
import {
    GetDeliveriesBySourceIdSchema,
    GetDeliveriesBySourceSchema,
    GetDeliveriesSchema,
    GetDeliveryByIdSchema,
    OverviewFilterSchema,
    TargetQuerySchema,
} from './delivery.schema';
import { ProjectHeadersSchema } from '@/core/utils/libs/zod';

const delivery = new Hono();

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

// Lazy wrapper for delivery routes rate limiter (user-based, normal level for read operations)
const deliveryRateLimiter = async (
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
        'Too many delivery requests'
    );
    return limiter(c, next);
};

delivery.use('*', authenticate);
delivery.use('*', validateProjectHeaders);
delivery.use('*', requireWorkspaceMembership(['owner', 'admin', 'member']));
delivery.use('*', requireProjectAccess());

/**
 * @title Get All Deliveries
 */
delivery.get(
    '/',
    deliveryRateLimiter,
    zValidator('query', GetDeliveriesSchema, (result, c) => {
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
    DeliveryController.getDeliveries
);

/**
 * @title Get Endpoints
 */
delivery.get(
    '/targets',
    deliveryRateLimiter,
    zValidator(
        'query',
        GetDeliveriesSchema.omit({ status: true }),
        (result, c) => {
            if (!result.success) {
                return c.json(
                    {
                        success: false,
                        statusCode: 400,
                        errors: JSON.parse(result.error.message).map(
                            (e: any) => ({
                                field: e.path.join('.') || 'unknown',
                                message: e.message,
                            })
                        ),
                    },
                    400
                );
            }
        }
    ),
    DeliveryController.getTargets
);

/**
 * @title Get by Target
 */
delivery.get(
    '/targets/:target',
    deliveryRateLimiter,
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
    zValidator('query', GetDeliveriesSchema, (result, c) => {
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
    DeliveryController.getDeliveriesByTarget
);

/**
 * @title Get by Target stats
 */
delivery.get(
    '/targets/:target/overview',
    deliveryRateLimiter,
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
    DeliveryController.getDeliveryStatsByTarget
);

/**
 * @title Get All Deliveries of specific source
 */
delivery.get(
    '/source/:sourceId',
    deliveryRateLimiter,
    zValidator('param', GetDeliveriesBySourceIdSchema, (result, c) => {
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
    zValidator('query', GetDeliveriesBySourceSchema, (result, c) => {
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
    DeliveryController.getDeliveriesBySource
);

/**
 * @title Get a specific delivery log
 */
delivery.get(
    '/:deliveryId',
    deliveryRateLimiter,
    zValidator('param', GetDeliveryByIdSchema, (result, c) => {
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
    DeliveryController.getDeliveryById
);

export default delivery;
