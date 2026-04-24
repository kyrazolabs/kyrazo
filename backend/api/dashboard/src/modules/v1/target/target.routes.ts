import { Hono } from 'hono';
import { NamespaceHeadersSchema } from '@kyrazo/shared';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { sentryMiddleware } from '@/core/middlewares/sentry.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { requireNamespaceAccess } from '@/core/middlewares/namespace.middleware';
import { validate } from '@/core/middlewares/validator.middleware';
import { targetReadRateLimiter, targetWriteRateLimiter } from './target.ratelimiter';
import {
    CreateTargetSchema,
    GetTargetByIdSchema,
    SearchTargetSchema,
    UpdateTargetSchema,
    UpdateTargetStatusSchema,
} from './target.schema';
import { TargetController } from './target.controller';

const target = new Hono();

// Header validation using validate
const validateNamespaceHeaders = validate('header', NamespaceHeadersSchema);

target.use('*', authenticate);
target.use('*', sentryMiddleware);
target.use('*', validateNamespaceHeaders);
target.use('*', requireWorkspaceMembership(['owner', 'admin', 'member']));
target.use('*', requireNamespaceAccess());

target.post(
    '/',
    targetWriteRateLimiter,
    validate('json', CreateTargetSchema),
    TargetController.createTarget
);

target.get(
    '/',
    targetReadRateLimiter,
    validate('query', SearchTargetSchema),
    TargetController.getTargets
);

target.get(
    '/:targetId',
    targetReadRateLimiter,
    validate('param', GetTargetByIdSchema),
    TargetController.getTarget
);

target.get(
    '/:targetId/secret',
    targetReadRateLimiter,
    validate('param', GetTargetByIdSchema),
    TargetController.getTargetSecret
);

target.patch(
    '/:targetId',
    targetWriteRateLimiter,
    validate('param', GetTargetByIdSchema),
    validate('json', UpdateTargetSchema),
    TargetController.updateTarget
);

target.put(
    '/:targetId',
    targetWriteRateLimiter,
    validate('json', UpdateTargetStatusSchema),
    TargetController.updateTargetStatus
);

target.delete(
    '/:targetId',
    targetWriteRateLimiter,
    validate('param', GetTargetByIdSchema),
    TargetController.deleteTarget
);

export default target;
