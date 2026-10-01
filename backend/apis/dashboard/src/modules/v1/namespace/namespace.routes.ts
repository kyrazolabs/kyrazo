import { Hono } from 'hono';
import { zValidator } from '@/core/middlewares/validator.middleware';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { requireNamespaceAccessParam } from '@/core/middlewares/namespace.middleware';
import { checkWorkspaceLimits } from '@/core/middlewares/limits.middleware';
import { requireRecentOTP } from '@/core/middlewares/otp.middleware';

import { NamespaceController } from '@/modules/v1/namespace/namespace.controller';

import {
    CreateNamespaceSchema,
    GetNamespaceByIdSchema,
    FilterNamespaceSchema,
} from './namespace.schema';
import { namespaceWriteRateLimiter, namespaceReadRateLimiter } from './namespace.ratelimiter';

const router = new Hono();

// All namespace routes require authentication
router.use(authenticate);

// Create namespace (requires workspace membership with admin/owner role)
router.post(
    '/',
    namespaceWriteRateLimiter,
    zValidator('json', CreateNamespaceSchema),
    requireWorkspaceMembership(['admin', 'owner']),
    checkWorkspaceLimits('maxNamespaces'),
    NamespaceController.createNamespace
);

// List namespaces for a specific workspace
router.get(
    '/workspace',
    namespaceReadRateLimiter,
    zValidator('query', FilterNamespaceSchema),
    requireWorkspaceMembership(),
    NamespaceController.listWorkspaceNamespaces
);

// Routes requiring namespace ownership or workspace membership
router.use(
    '/:namespaceId/*',
    zValidator('param', GetNamespaceByIdSchema) as any,
    requireWorkspaceMembership(['owner', 'admin', 'member'])
); // Assuming namespace access is tied to workspace membership

router.get(
    '/:namespaceId',
    namespaceReadRateLimiter,
    zValidator('param', GetNamespaceByIdSchema),
    NamespaceController.getNamespaceById
);

router.patch(
    '/:namespaceId',
    namespaceWriteRateLimiter,
    zValidator('param', GetNamespaceByIdSchema),
    zValidator('json', CreateNamespaceSchema),
    requireNamespaceAccessParam(['owner', 'admin']), // Namespace deletion requires ownership
    requireRecentOTP('update_namespace'),
    NamespaceController.updateNamespace
);

router.delete(
    '/:namespaceId',
    namespaceWriteRateLimiter,
    zValidator('param', GetNamespaceByIdSchema),
    requireNamespaceAccessParam(['owner', 'admin']), // Namespace deletion requires ownership
    requireRecentOTP('delete_namespace'),
    NamespaceController.deleteNamespace
);

router.post(
    '/:namespaceId/restore',
    namespaceWriteRateLimiter,
    zValidator('param', GetNamespaceByIdSchema),
    requireNamespaceAccessParam(['owner', 'admin'], { allowDeleted: true }), // Allow access to deleted namespaces for restore
    NamespaceController.restoreNamespace
);

export default router;
