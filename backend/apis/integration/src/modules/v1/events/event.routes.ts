import { Hono } from 'hono';
import type { AppContext } from '@/core/middlewares/auth.middleware';
import { validator } from '@/core/middlewares/validator.middleware';
import { PublishEventSchema, BatchPublishEventsSchema } from './event.schema';
import { authenticate, checkScope } from '@/core/middlewares/auth.middleware';
import { EventController } from '@/modules/v1/events/event.controller';
import { GetNamespaceByIdSchema } from '@/core/utils/libs/zod';
import { createDynamicRateLimiter } from '@/core/middlewares/security.middleware';
import { idempotencyMiddleware } from '@/core/middlewares/idem.middleware';

const event = new Hono();

event.post(
    '/:namespaceId/publish',
    validator('param', GetNamespaceByIdSchema),

    authenticate,
    checkScope('dispatch:event'),
    createDynamicRateLimiter((c: AppContext) => c.workspace?.workspaceId?.toString()),
    idempotencyMiddleware,
    validator('json', PublishEventSchema),
    EventController.publishEvent
);

event.post(
    '/:namespaceId/publish/batch',
    validator('param', GetNamespaceByIdSchema),

    authenticate,
    checkScope('dispatch:event:batch'),
    createDynamicRateLimiter((c: AppContext) => c.workspace?.workspaceId?.toString()),
    idempotencyMiddleware,
    validator('json', BatchPublishEventsSchema),
    EventController.publishEvents
);

export default event;
