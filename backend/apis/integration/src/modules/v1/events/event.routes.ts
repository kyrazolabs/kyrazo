import { Hono } from 'hono';
import type { AppContext } from '@/core/middlewares/auth.middleware';
import { validate } from '@/core/middlewares/validator.middleware';
import { PublishEventSchema, BatchPublishEventsSchema } from './event.schema';
import { authenticate, checkScope } from '@/core/middlewares/auth.middleware';
import { EventController } from '@/modules/v1/events/event.controller';
import { GetNamespaceByIdSchema } from '@/core/utils/libs/zod';
import { createDynamicRateLimiter } from '@/core/middlewares/security.middleware';
import { idempotencyMiddleware } from '@/core/middlewares/idem.middleware';

const event = new Hono();

event.post(
    '/:namespaceId/publish',
    validate('param', GetNamespaceByIdSchema),

    authenticate,
    checkScope('dispatch:event'),
    createDynamicRateLimiter((c: AppContext) => c.workspace?.workspaceId?.toString()),
    idempotencyMiddleware,
    validate('json', PublishEventSchema),
    EventController.publishEvent
);

event.post(
    '/:namespaceId/publish/batch',
    validate('param', GetNamespaceByIdSchema),

    authenticate,
    checkScope('dispatch:event:batch'),
    createDynamicRateLimiter((c: AppContext) => c.workspace?.workspaceId?.toString()),
    idempotencyMiddleware,
    validate('json', BatchPublishEventsSchema),
    EventController.publishEvents
);

export default event;
