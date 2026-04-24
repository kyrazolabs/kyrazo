import { Hono } from 'hono';
import { validate } from '@/core/middlewares/validator.middleware';
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

// Header validation using validate
const validateNamespaceHeaders = validate('header', NamespaceHeadersSchema);

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
    validate('param', GetIngestEventsSchema),
    validate('query', GetIngestsEventsBySourceSchema),
    IngestController.getIngestEventsBySource
);

/**
 * @title Get All Ingest events
 */
ingest.get(
    '/events',
    ingestRateLimiter,
    validate('query', GetIngestEventsSchema),
    IngestController.getIngestEvents
);

/**
 * @title Get a specific ingest log
 */
ingest.get(
    '/events/:eventId',
    ingestRateLimiter,
    validate('param', GetIngestsByEventIdSchema),
    IngestController.getIngestEventById
);

export default ingest;
