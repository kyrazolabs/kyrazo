import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ProjectHeadersSchema } from '@/core/utils/libs/zod';
import { AppContext, authenticate } from '@/core/middlewares/auth.middleware';
import {
    createRateLimitMiddleware,
    createSlidingWindowLimiter,
} from '@/core/middlewares/rate-limiter.middleware';
import { config } from '@/configs';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { requireProjectAccess } from '@/core/middlewares/project.middleware';
import {
    GetIngestEventsSchema,
    GetIngestsEventsBySourceSchema,
} from './ingest.schema';
import z from 'zod';
import { IngestController } from './ingest.controller';

const ingest = new Hono();

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

// Lazy wrapper for ingest routes rate limiter (user-based, normal level for read operations)
const ingestRateLimiter = async (c: AppContext, next: () => Promise<void>) => {
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
        'Too many ingest requests'
    );
    return limiter(c, next);
};

ingest.use('*', authenticate);
ingest.use('*', validateProjectHeaders);
ingest.use('*', requireWorkspaceMembership(['owner', 'admin', 'member']));
ingest.use('*', requireProjectAccess());

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
    zValidator(
        'param',
        z.object({ eventId: z.string().uuidv4() }),
        (result, c) => {
            if (!result.success) {
                return c.json(
                    {
                        success: false,
                        statusCode: 400,
                        errors: JSON.parse(result.error.message).map(
                            (e: any) => ({
                                field: e.path.join('.') || 'unknown',
                                message: e.message,
                            })
                        ),
                    },
                    400
                );
            }
        }
    ),
    IngestController.getIngestEventById
);

export default ingest;
