import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authenticate, checkScope } from '@/core/middlewares/auth.middleware';
import {
    targetReadRateLimiter,
    targetWriteRateLimiter,
} from './target.rate-limiter';
import {
    CreateTargetSchema,
    GetTargetByIdSchema,
    SearchTargetSchema,
    UpdateTargetSchema,
    UpdateTargetStatusSchema,
} from './target.schema';
import { TargetController } from './target.controller';
import { GetProjectByIdSchema } from '@/core/utils/libs/zod';

const target = new Hono();

// Auth and Project validation is handled by authenticate middleware
// which requires :projectId in the path or params.
// We'll define routes with :projectId prefix.

target.post(
    '/:projectId',
    authenticate,
    checkScope('dispatch:target:create'),
    targetWriteRateLimiter,
    zValidator('param', GetProjectByIdSchema),
    zValidator('json', CreateTargetSchema),
    TargetController.createTarget
);

target.get(
    '/:projectId',
    authenticate,
    checkScope('dispatch:target:read'),
    targetReadRateLimiter,
    zValidator('param', GetProjectByIdSchema),
    zValidator('query', SearchTargetSchema),
    TargetController.getTargets
);

target.get(
    '/:projectId/:targetId',
    authenticate,
    checkScope('dispatch:target:read'),
    targetReadRateLimiter,
    zValidator('param', GetProjectByIdSchema.extend(GetTargetByIdSchema.shape)),
    TargetController.getTarget
);

target.get(
    '/:projectId/:targetId/secret',
    authenticate,
    checkScope('dispatch:target:read'),
    targetReadRateLimiter,
    zValidator('param', GetProjectByIdSchema.extend(GetTargetByIdSchema.shape)),
    TargetController.getTargetSecret
);

target.patch(
    '/:projectId/:targetId',
    authenticate,
    checkScope('dispatch:target:update'),
    targetWriteRateLimiter,
    zValidator('param', GetProjectByIdSchema.extend(GetTargetByIdSchema.shape)),
    zValidator('json', UpdateTargetSchema),
    TargetController.updateTarget
);

target.put(
    '/:projectId/:targetId',
    authenticate,
    checkScope('dispatch:target:update'),
    targetWriteRateLimiter,
    zValidator('param', GetProjectByIdSchema.extend(GetTargetByIdSchema.shape)),
    zValidator('json', UpdateTargetStatusSchema),
    TargetController.updateTargetStatus
);

target.delete(
    '/:projectId/:targetId',
    authenticate,
    checkScope('dispatch:target:delete'),
    targetWriteRateLimiter,
    zValidator('param', GetProjectByIdSchema.extend(GetTargetByIdSchema.shape)),
    TargetController.deleteTarget
);

export default target;
