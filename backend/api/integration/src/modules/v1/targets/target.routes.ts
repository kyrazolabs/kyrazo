import { Hono } from 'hono';
import { validator } from '@/core/middlewares/validator.middleware';
import { authenticate, checkScope } from '@/core/middlewares/auth.middleware';
import { targetReadRateLimiter, targetWriteRateLimiter } from './target.rate-limiter';
import {
    CreateTargetSchema,
    GetTargetByIdSchema,
    SearchTargetSchema,
    UpdateTargetSchema,
    UpdateTargetStatusSchema,
} from './target.schema';
import { TargetController } from './target.controller';
import { GetNamespaceByIdSchema } from '@/core/utils/libs/zod';

const target = new Hono();

// Auth and Namespace validation is handled by authenticate middleware
// which requires :namespaceId in the path or params.
// We'll define routes with :namespaceId prefix.

target.post(
    '/:namespaceId',
    authenticate,
    checkScope('dispatch:target:create'),
    targetWriteRateLimiter,
    validator('param', GetNamespaceByIdSchema),
    validator('json', CreateTargetSchema),
    TargetController.createTarget
);

target.get(
    '/:namespaceId',
    authenticate,
    checkScope('dispatch:target:read'),
    targetReadRateLimiter,
    validator('param', GetNamespaceByIdSchema),
    validator('query', SearchTargetSchema),
    TargetController.getTargets
);

target.get(
    '/:namespaceId/:targetId',
    authenticate,
    checkScope('dispatch:target:read'),
    targetReadRateLimiter,
    validator('param', GetNamespaceByIdSchema.extend(GetTargetByIdSchema.shape)),
    TargetController.getTarget
);

target.get(
    '/:namespaceId/:targetId/secret',
    authenticate,
    checkScope('dispatch:target:read'),
    targetReadRateLimiter,
    validator('param', GetNamespaceByIdSchema.extend(GetTargetByIdSchema.shape)),
    TargetController.getTargetSecret
);

target.patch(
    '/:namespaceId/:targetId',
    authenticate,
    checkScope('dispatch:target:update'),
    targetWriteRateLimiter,
    validator('param', GetNamespaceByIdSchema.extend(GetTargetByIdSchema.shape)),
    validator('json', UpdateTargetSchema),
    TargetController.updateTarget
);

target.put(
    '/:namespaceId/:targetId',
    authenticate,
    checkScope('dispatch:target:update'),
    targetWriteRateLimiter,
    validator('param', GetNamespaceByIdSchema.extend(GetTargetByIdSchema.shape)),
    validator('json', UpdateTargetStatusSchema),
    TargetController.updateTargetStatus
);

target.delete(
    '/:namespaceId/:targetId',
    authenticate,
    checkScope('dispatch:target:delete'),
    targetWriteRateLimiter,
    validator('param', GetNamespaceByIdSchema.extend(GetTargetByIdSchema.shape)),
    TargetController.deleteTarget
);

export default target;
