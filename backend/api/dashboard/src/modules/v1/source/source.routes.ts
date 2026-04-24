import { Hono } from 'hono';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { sentryMiddleware } from '@/core/middlewares/sentry.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { requireNamespaceAccess } from '@/core/middlewares/namespace.middleware';
import { validate } from '@/core/middlewares/validator.middleware';

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

// Header validation using validate
const validateNamespaceHeaders = validate('header', NamespaceHeadersSchema);

source.use('*', authenticate);
source.use('*', sentryMiddleware);
source.use('*', validateNamespaceHeaders);
source.use('*', requireWorkspaceMembership(['owner', 'admin', 'member']));
source.use('*', requireNamespaceAccess());

source.post(
    '/',
    sourceWriteRateLimiter,
    validate('json', CreateSourceSchema),
    SourceController.createSource
);

source.get(
    '/',
    sourceReadRateLimiter,
    validate('query', SearchSourceSchema),
    SourceController.getSources
);

source.get(
    '/:sourceId',
    sourceReadRateLimiter,
    validate('param', GetSourceByIdSchema),
    SourceController.getSource
);

source.patch(
    '/:sourceId',
    sourceWriteRateLimiter,
    validate('param', GetSourceByIdSchema),
    validate('json', UpdateSourceSchema),
    SourceController.updateSource
);

source.put(
    '/:sourceId/auth',
    sourceWriteRateLimiter,
    validate('param', GetSourceByIdSchema),
    validate('json', UpdateSourceAuthSchema),
    SourceController.updateSourceAuth
);

source.delete(
    '/:sourceId',
    sourceWriteRateLimiter,
    validate('param', GetSourceByIdSchema),
    SourceController.deleteSource
);
export default source;
