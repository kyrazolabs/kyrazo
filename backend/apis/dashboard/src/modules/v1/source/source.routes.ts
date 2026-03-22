import { Hono } from 'hono';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { sentryMiddleware } from '@/core/middlewares/sentry.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { requireNamespaceAccess } from '@/core/middlewares/namespace.middleware';
import { zValidator } from '@hono/zod-validator';

import {
    CreateSourceSchema,
    SearchSourceSchema,
    UpdateSourceSchema,
    UpdateSourceAuthSchema,
    GetSourceByIdSchema,
} from './source.schema';
import { NamespaceHeadersSchema } from '@/core/utils/libs/zod';
import { SourceController } from '@/modules/v1/source/source.controller';
import { sourceWriteRateLimiter, sourceReadRateLimiter } from './source.ratelimiter';

const source = new Hono();

// Header validation using zValidator
const validateNamespaceHeaders = zValidator('header', NamespaceHeadersSchema, (result, c) => {
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
});

source.use('*', authenticate);
source.use('*', sentryMiddleware);
source.use('*', validateNamespaceHeaders);
source.use('*', requireWorkspaceMembership(['owner', 'admin', 'member']));
source.use('*', requireNamespaceAccess());

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

source.put(
    '/:sourceId/auth',
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
    zValidator('json', UpdateSourceAuthSchema, (result, c) => {
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
    SourceController.updateSourceAuth
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
