import { Hono } from 'hono';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { sentryMiddleware } from '@/core/middlewares/sentry.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { requireNamespaceAccessParam } from '@/core/middlewares/namespace.middleware';
import { checkWorkspaceLimits } from '@/core/middlewares/limits.middleware';
import { validate } from '@/core/middlewares/validator.middleware';
import {
    namespaceReadRateLimiter,
    namespaceWriteRateLimiter
} from './namespace.ratelimiter';
import {
    CreateNamespaceSchema,
    UpdateNamespaceSchema,
    NamespaceIdParamSchema,
    SearchNamespaceSchema
} from './namespace.schema';
import { NamespaceControllerV2 } from './namespace.controller';

const namespaces = new Hono();

namespaces.use('*', authenticate);
namespaces.use('*', sentryMiddleware);
namespaces.use('*', requireWorkspaceMembership(['owner', 'admin', 'member']));

// POST /namespaces → Create a new namespace with optional managed transformer
namespaces.post(
    '/',
    namespaceWriteRateLimiter,
    validate('json', CreateNamespaceSchema),
    requireWorkspaceMembership(['owner', 'admin']),
    checkWorkspaceLimits('maxNamespaces'),
    NamespaceControllerV2.createNamespace
);

// GET /namespaces → List namespaces for the current workspace
namespaces.get(
    '/',
    namespaceReadRateLimiter,
    validate('query', SearchNamespaceSchema),
    NamespaceControllerV2.listNamespaces
);

// GET /namespaces/:namespaceId → Get single namespace
namespaces.get(
    '/:namespaceId',
    namespaceReadRateLimiter,
    validate('param', NamespaceIdParamSchema),
    requireNamespaceAccessParam(),
    NamespaceControllerV2.getNamespaceById
);

// PUT /namespaces/:namespaceId → Update namespace
namespaces.put(
    '/:namespaceId',
    namespaceWriteRateLimiter,
    validate('param', NamespaceIdParamSchema),
    validate('json', UpdateNamespaceSchema),
    requireNamespaceAccessParam(['owner', 'admin']),
    NamespaceControllerV2.updateNamespace
);

// DELETE /namespaces/:namespaceId → Delete namespace (soft delete)
namespaces.delete(
    '/:namespaceId',
    namespaceWriteRateLimiter,
    validate('param', NamespaceIdParamSchema),
    requireNamespaceAccessParam(['owner', 'admin']),
    NamespaceControllerV2.deleteNamespace
);

// POST /namespaces/:namespaceId/restore → Restore a soft-deleted namespace
namespaces.post(
    '/:namespaceId/restore',
    namespaceWriteRateLimiter,
    validate('param', NamespaceIdParamSchema),
    requireNamespaceAccessParam(['owner', 'admin'], { allowDeleted: true }),
    NamespaceControllerV2.restoreNamespace
);

export default namespaces;
