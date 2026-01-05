import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ProjectHeadersSchema } from '@kyrazo/shared';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { requireProjectAccess } from '@/core/middlewares/project.middleware';
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

const target = new Hono();

// Header validation using zValidator
const validateProjectHeaders = zValidator(
    'header',
    ProjectHeadersSchema,
    (result, c) => {
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
    }
);

target.use('*', authenticate);
target.use('*', validateProjectHeaders);
target.use('*', requireWorkspaceMembership(['owner', 'admin', 'member']));
target.use('*', requireProjectAccess());

target.post(
    '/',
    targetWriteRateLimiter,
    zValidator('json', CreateTargetSchema, (result, c) => {
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
    TargetController.createTarget
);

target.get(
    '/',
    targetReadRateLimiter,
    zValidator('query', SearchTargetSchema, (result, c) => {
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
    TargetController.getTargets
);

target.get(
    '/:targetId',
    targetReadRateLimiter,
    zValidator('param', GetTargetByIdSchema, (result, c) => {
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
    TargetController.getTarget
);

target.get(
    '/:targetId/secret',
    targetReadRateLimiter,
    zValidator('param', GetTargetByIdSchema, (result, c) => {
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
    TargetController.getTargetSecret
);

target.patch(
    '/:targetId',
    targetWriteRateLimiter,
    zValidator('param', GetTargetByIdSchema, (result, c) => {
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
    zValidator('json', UpdateTargetSchema, (result, c) => {
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
    TargetController.updateTarget
);

target.put(
    '/:targetId',
    targetWriteRateLimiter,
    zValidator('json', UpdateTargetStatusSchema, (result, c) => {
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
    TargetController.updateTargetStatus
);

target.delete(
    '/:targetId',
    targetWriteRateLimiter,
    zValidator('param', GetTargetByIdSchema, (result, c) => {
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
    TargetController.deleteTarget
);

export default target;
