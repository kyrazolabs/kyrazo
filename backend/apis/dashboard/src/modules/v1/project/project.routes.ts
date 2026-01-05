import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { AppContext, authenticate } from '@/core/middlewares/auth.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { requireProjectAccessParam } from '@/core/middlewares/project.middleware';
import { checkWorkspaceLimits } from '@/core/middlewares/limits.middleware';

import { ProjectController } from '@/modules/v1/project/project.controller';
import { config } from '@/configs/app';
import {
    createSlidingWindowLimiter,
    createRateLimitMiddleware,
} from '@/core/middlewares/rate-limiter.middleware';
import {
    CreateProjectSchema,
    GetProjectByIdSchema,
    FilterProjectSchema,
} from './project.schema';

const router = new Hono();

// Lazy wrappers for project routes rate limiter (user-based)
const projectReadRateLimiter = async (
    c: AppContext,
    next: () => Promise<void>
) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.protected.normal.points,
            duration: config.security.rateLimiter.protected.normal.duration,
            blockDuration:
                config.security.rateLimiter.protected.normal.blockDuration,
        }),
        c =>
            config.security.rateLimiter.protected.normal.keyPrefix(
                (c as any).user.userId
            ),
        'Too many project read requests'
    );
    return limiter(c, next);
};

const projectWriteRateLimiter = async (
    c: AppContext,
    next: () => Promise<void>
) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.protected.medium.points,
            duration: config.security.rateLimiter.protected.medium.duration,
            blockDuration:
                config.security.rateLimiter.protected.medium.blockDuration,
        }),
        c =>
            config.security.rateLimiter.protected.medium.keyPrefix(
                (c as any).user.userId
            ),
        'Too many project write requests'
    );
    return limiter(c, next);
};

// All project routes require authentication
router.use(authenticate);

// Create project (requires workspace membership with admin/owner role)
router.post(
    '/',
    projectWriteRateLimiter,
    zValidator('json', CreateProjectSchema, (result, c) => {
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
    requireWorkspaceMembership(['admin', 'owner']),
    checkWorkspaceLimits('maxProjects'),
    ProjectController.createProject
);

// List projects for a specific workspace
router.get(
    '/workspace',
    projectReadRateLimiter,
    zValidator('query', FilterProjectSchema, (result, c) => {
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
    requireWorkspaceMembership(),
    ProjectController.listWorkspaceProjects
);

// Routes requiring project ownership or workspace membership
router.use(
    '/:projectId/*',
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
    requireWorkspaceMembership(['owner', 'admin', 'member'])
); // Assuming project access is tied to workspace membership

router.get(
    '/:projectId',
    projectReadRateLimiter,
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
    ProjectController.getProjectById
);

router.patch(
    '/:projectId',
    projectWriteRateLimiter,
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
    zValidator('json', CreateProjectSchema, (result, c) => {
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
    requireProjectAccessParam(['owner', 'admin']), // Project deletion requires ownership
    ProjectController.updateProject
);

router.delete(
    '/:projectId',
    projectWriteRateLimiter,
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
    requireProjectAccessParam(['owner', 'admin']), // Project deletion requires ownership
    ProjectController.deleteProject
);

router.post(
    '/:projectId/restore',
    projectWriteRateLimiter,
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
    requireProjectAccessParam(['owner', 'admin'], { allowDeleted: true }), // Allow access to deleted projects for restore
    ProjectController.restoreProject
);

export default router;
