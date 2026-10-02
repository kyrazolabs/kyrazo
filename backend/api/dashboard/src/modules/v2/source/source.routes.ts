import { Hono } from 'hono';
import { NamespaceHeadersSchema } from '@kyrazo/shared';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { sentryMiddleware } from '@/core/middlewares/sentry.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { requireNamespaceAccess } from '@/core/middlewares/namespace.middleware';
import { validate } from '@/core/middlewares/validator.middleware';
import {
    sourceReadRateLimiter,
    sourceWriteRateLimiter
} from './source.ratelimiter';
import {
    CreateSourceSchema,
    UpdateSourceSchema,
    SourceIdParamSchema,
    SearchSourceSchema
} from './source.schema';
import { SourceControllerV2 } from './source.controller';

const sources = new Hono();

// Header validation using validate
const validateNamespaceHeaders = validate('header', NamespaceHeadersSchema);

sources.use('*', authenticate);
sources.use('*', sentryMiddleware);
sources.use('*', validateNamespaceHeaders);
sources.use('*', requireWorkspaceMembership(['owner', 'admin', 'member']));
sources.use('*', requireNamespaceAccess());

// POST /sources → Create a new source with optional managed transformer
sources.post(
    '/',
    sourceWriteRateLimiter,
    validate('json', CreateSourceSchema),
    SourceControllerV2.create
);

// GET /sources → List sources
sources.get(
    '/',
    sourceReadRateLimiter,
    validate('query', SearchSourceSchema),
    SourceControllerV2.list
);

// GET /sources/:id → Get single source
sources.get(
    '/:id',
    sourceReadRateLimiter,
    validate('param', SourceIdParamSchema),
    SourceControllerV2.get
);

// PUT /sources/:id → Update source
sources.put(
    '/:id',
    sourceWriteRateLimiter,
    validate('param', SourceIdParamSchema),
    validate('json', UpdateSourceSchema),
    SourceControllerV2.update
);

// DELETE /sources/:id → Delete source and managed transformer
sources.delete(
    '/:id',
    sourceWriteRateLimiter,
    validate('param', SourceIdParamSchema),
    SourceControllerV2.delete
);

export default sources;
