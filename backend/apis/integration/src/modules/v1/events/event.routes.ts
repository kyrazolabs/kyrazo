import { Hono } from 'hono';
import type { AppContext } from '@/core/middlewares/auth.middleware';
import { zValidator } from '@hono/zod-validator';
import { PublishEventSchema, BatchPublishEventsSchema } from './event.schema';
import { authenticate, checkScope } from '@/core/middlewares/auth.middleware';
import { EventController } from '@/modules/v1/events/event.controller';
import { GetProjectByIdSchema } from '@/core/utils/libs/zod';
import { createDynamicRateLimiter } from '@/core/middlewares/security.middleware';
import { idempotencyMiddleware } from '@/core/middlewares/idem.middleware';

const event = new Hono();

event.post(
    '/:projectId/publish',
    zValidator('param', GetProjectByIdSchema, (result, c) => {
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

    authenticate,
    checkScope('dispatch:event'),
    createDynamicRateLimiter((c: AppContext) => c.workspace?.workspaceId?.toString()),
    idempotencyMiddleware,
    zValidator('json', PublishEventSchema, (result, c) => {
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
    EventController.publishEvent
);

event.post(
    '/:projectId/publish/batch',
    zValidator('param', GetProjectByIdSchema, (result, c) => {
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

    authenticate,
    checkScope('dispatch:event:batch'),
    createDynamicRateLimiter((c: AppContext) => c.workspace?.workspaceId?.toString()),
    idempotencyMiddleware,
    zValidator('json', BatchPublishEventsSchema, (result, c) => {
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
    EventController.publishEvents
);

export default event;
