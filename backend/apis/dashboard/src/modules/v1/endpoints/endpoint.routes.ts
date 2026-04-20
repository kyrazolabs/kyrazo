import { Hono } from 'hono';
import { validate } from '@/core/middlewares/validator.middleware';
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

// Header validation using validate
const validateNamespaceHeaders = validate('header', NamespaceHeadersSchema);

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
    validate('json', CreateEndpointSchema),
    EndpointController.createEndpoint
);

endpoint.get(
    '/',
    endpointReadRateLimiter,
    validate('query', SearchEndpointSchema),
    EndpointController.getEndpoints
);

endpoint.get(
    '/:endpointId',
    endpointReadRateLimiter,
    validate('param', GetEndpointByIdSchema),
    EndpointController.getEndpoint
);

endpoint.get(
    '/:endpointId/secret',
    endpointReadRateLimiter,
    validate('param', GetEndpointByIdSchema),
    EndpointController.getEndpointSecret
);

endpoint.patch(
    '/:endpointId',
    endpointWriteRateLimiter,
    validate('param', GetEndpointByIdSchema),
    validate('json', UpdateEndpointSchema),
    EndpointController.updateEndpoint
);

endpoint.put(
    '/:endpointId/:status',
    endpointWriteRateLimiter,
    validate('param', UpdateEndpointStatusSchema),
    EndpointController.updateEndpointStatus
);

endpoint.delete(
    '/:endpointId',
    endpointWriteRateLimiter,
    validate('param', GetEndpointByIdSchema),
    EndpointController.deleteEndpoint
);

export default endpoint;
