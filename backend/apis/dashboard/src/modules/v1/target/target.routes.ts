import { Hono } from 'hono';
import { NamespaceHeadersSchema } from '@kyrazo/shared';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { sentryMiddleware } from '@/core/middlewares/sentry.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { requireNamespaceAccess } from '@/core/middlewares/namespace.middleware';
import { zValidator } from '@/core/middlewares/validator.middleware';
import { targetReadRateLimiter, targetWriteRateLimiter } from './target.rate-limiter';
import {
    CreateTargetSchema,
    GetTargetByIdSchema,
    SearchTargetSchema,
    UpdateTargetSchema,
    UpdateTargetStatusSchema,
} from './target.schema';
import { TargetController } from './target.controller';

const target = new Hono();

// Header validation using zValidator
const validateNamespaceHeaders = zValidator('header', NamespaceHeadersSchema);

target.use('*', authenticate);
target.use('*', sentryMiddleware);
target.use('*', validateNamespaceHeaders);
target.use('*', requireWorkspaceMembership(['owner', 'admin', 'member']));
target.use('*', requireNamespaceAccess());

target.post(
    '/',
    targetWriteRateLimiter,
    zValidator('json', CreateTargetSchema),
    TargetController.createTarget
);

target.get(
    '/',
    targetReadRateLimiter,
    zValidator('query', SearchTargetSchema),
    TargetController.getTargets
);

target.get(
    '/:targetId',
    targetReadRateLimiter,
    zValidator('param', GetTargetByIdSchema),
    TargetController.getTarget
);

target.get(
    '/:targetId/secret',
    targetReadRateLimiter,
    zValidator('param', GetTargetByIdSchema),
    TargetController.getTargetSecret
);

target.patch(
    '/:targetId',
    targetWriteRateLimiter,
    zValidator('param', GetTargetByIdSchema),
    zValidator('json', UpdateTargetSchema),
    TargetController.updateTarget
);

target.put(
    '/:targetId',
    targetWriteRateLimiter,
    zValidator('json', UpdateTargetStatusSchema),
    TargetController.updateTargetStatus
);

target.delete(
    '/:targetId',
    targetWriteRateLimiter,
    zValidator('param', GetTargetByIdSchema),
    TargetController.deleteTarget
);

export default target;
