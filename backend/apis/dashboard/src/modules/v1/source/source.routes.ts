import { Hono } from 'hono';
import { AppContext } from '@/core/middlewares/auth.middleware';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { requireProjectAccess } from '@/core/middlewares/project.middleware';
import { zValidator } from '@hono/zod-validator';
import { config } from '@/configs/app';
import {
    createSlidingWindowLimiter,
    createRateLimitMiddleware,
} from '@/core/middlewares/rate-limiter.middleware';
import {
    CreateSourceSchema,
    SearchSourceSchema,
    UpdateSourceSchema,
    GetSourceByIdSchema,
} from './source.schema';
import { ProjectHeadersSchema } from '@/core/utils/libs/zod';
import { SourceController } from '@/modules/v1/source/source.controller';

const source = new Hono();

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

// Lazy wrappers for source routes rate limiter (user-based)
const sourceReadRateLimiter = async (
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
        'Too many source read requests'
    );
    return limiter(c, next);
};

const sourceWriteRateLimiter = async (
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
        'Too many source write requests'
    );
    return limiter(c, next);
};

source.use('*', authenticate);
source.use('*', validateProjectHeaders);
source.use('*', requireWorkspaceMembership(['owner', 'admin', 'member']));
source.use('*', requireProjectAccess());

source.post(
    '/',
    sourceWriteRateLimiter,
    zValidator('json', CreateSourceSchema, (result, c) => {
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
    SourceController.createSource
);

source.get(
    '/',
    sourceReadRateLimiter,
    zValidator('query', SearchSourceSchema, (result, c) => {
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
    SourceController.getSources
);

source.get(
    '/:sourceId',
    sourceReadRateLimiter,
    zValidator('param', GetSourceByIdSchema, (result, c) => {
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
    SourceController.getSource
);

source.patch(
    '/:sourceId',
    sourceWriteRateLimiter,
    zValidator('param', GetSourceByIdSchema, (result, c) => {
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
    zValidator('json', UpdateSourceSchema, (result, c) => {
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
    SourceController.updateSource
);

source.delete(
    '/:sourceId',
    sourceWriteRateLimiter,
    zValidator('param', GetSourceByIdSchema, (result, c) => {
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
    SourceController.deleteSource
);
export default source;
