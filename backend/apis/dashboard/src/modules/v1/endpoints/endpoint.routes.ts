import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { AppContext } from '@/core/middlewares/auth.middleware';

import { authenticate } from '@/core/middlewares/auth.middleware';
import { sentryMiddleware } from '@/core/middlewares/sentry.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { requireNamespaceAccess } from '@/core/middlewares/namespace.middleware';
import { config } from '@/configs/app';
import {
    createSlidingWindowLimiter,
    createRateLimitMiddleware,
} from '@/core/middlewares/rate-limiter.middleware';
import {
    CreateEndpointSchema,
    SearchEndpointSchema,
    UpdateEndpointSchema,
    UpdateEndpointStatusSchema,
    GetEndpointByIdSchema,
} from './/endpoint.schema';
import { EndpointController } from '@/modules/v1/endpoints/endpoint.controller';
import { NamespaceHeadersSchema } from '@/core/utils/libs/zod';

const endpoint = new Hono();

// Header validation using zValidator
const validateNamespaceHeaders = zValidator('header', NamespaceHeadersSchema, (result, c) => {
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
});

// Lazy wrappers for endpoint routes rate limiters (user-based)
const endpointReadRateLimiter = async (c: AppContext, next: () => Promise<void>) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.protected.normal.points,
            duration: config.security.rateLimiter.protected.normal.duration,
            blockDuration: config.security.rateLimiter.protected.normal.blockDuration,
        }),
        c => config.security.rateLimiter.protected.normal.keyPrefix((c as any).user.userId),
        'Too many endpoint read requests'
    );
    return limiter(c, next);
};

const endpointWriteRateLimiter = async (c: AppContext, next: () => Promise<void>) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.protected.medium.points,
            duration: config.security.rateLimiter.protected.medium.duration,
            blockDuration: config.security.rateLimiter.protected.medium.blockDuration,
        }),
        c => config.security.rateLimiter.protected.medium.keyPrefix((c as any).user.userId),
        'Too many endpoint write requests'
    );
    return limiter(c, next);
};

endpoint.use('*', authenticate);
endpoint.use('*', sentryMiddleware);
endpoint.use('*', validateNamespaceHeaders);
endpoint.use('*', requireWorkspaceMembership(['owner', 'admin', 'member']));
endpoint.use('*', requireNamespaceAccess());

endpoint.post(
    '/',
    endpointWriteRateLimiter,
    zValidator('json', CreateEndpointSchema, (result, c) => {
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
    EndpointController.createEndpoint
);

endpoint.get(
    '/',
    endpointReadRateLimiter,
    zValidator('query', SearchEndpointSchema, (result, c) => {
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
    EndpointController.getEndpoints
);

endpoint.get(
    '/:endpointId',
    endpointReadRateLimiter,
    zValidator('param', GetEndpointByIdSchema, (result, c) => {
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
    EndpointController.getEndpoint
);

endpoint.get(
    '/:endpointId/secret',
    endpointReadRateLimiter,
    zValidator('param', GetEndpointByIdSchema, (result, c) => {
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
    EndpointController.getEndpointSecret
);

endpoint.patch(
    '/:endpointId',
    endpointWriteRateLimiter,
    zValidator('param', GetEndpointByIdSchema, (result, c) => {
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
    zValidator('json', UpdateEndpointSchema, (result, c) => {
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
    EndpointController.updateEndpoint
);

endpoint.put(
    '/:endpointId/:status',
    endpointWriteRateLimiter,
    zValidator('param', UpdateEndpointStatusSchema, (result, c) => {
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
    EndpointController.updateEndpointStatus
);

endpoint.delete(
    '/:endpointId',
    endpointWriteRateLimiter,
    zValidator('param', GetEndpointByIdSchema, (result, c) => {
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
    EndpointController.deleteEndpoint
);

export default endpoint;
