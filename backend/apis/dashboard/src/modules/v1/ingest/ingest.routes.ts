import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { NamespaceHeadersSchema } from '@/core/utils/libs/zod';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { sentryMiddleware } from '@/core/middlewares/sentry.middleware';

import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { requireNamespaceAccess } from '@/core/middlewares/namespace.middleware';
import {
    GetIngestEventsSchema,
    GetIngestsByEventIdSchema,
    GetIngestsEventsBySourceSchema,
} from './ingest.schema';
import z from 'zod';
import { IngestController } from './ingest.controller';
import { ingestRateLimiter } from './ingest.ratelimiter';

const ingest = new Hono();

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

ingest.use('*', authenticate);
ingest.use('*', sentryMiddleware);
ingest.use('*', validateNamespaceHeaders);
ingest.use('*', requireWorkspaceMembership(['owner', 'admin', 'member']));
ingest.use('*', requireNamespaceAccess());

/**
 * @title Get All ingest events of specific source
 */
ingest.get(
    '/source/:sourceId',
    ingestRateLimiter,
    zValidator('param', GetIngestEventsSchema, (result, c) => {
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
    zValidator('query', GetIngestsEventsBySourceSchema, (result, c) => {
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
    IngestController.getIngestEventsBySource
);

/**
 * @title Get All Ingest events
 */
ingest.get(
    '/events',
    ingestRateLimiter,
    zValidator('query', GetIngestEventsSchema, (result, c) => {
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
    IngestController.getIngestEvents
);

/**
 * @title Get a specific ingest log
 */
ingest.get(
    '/events/:eventId',
    ingestRateLimiter,
    zValidator('param', GetIngestsByEventIdSchema, (result, c) => {
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
    IngestController.getIngestEventById
);

export default ingest;
