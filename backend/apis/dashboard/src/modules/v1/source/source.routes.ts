import { Hono } from 'hono';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { sentryMiddleware } from '@/core/middlewares/sentry.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { requireNamespaceAccess } from '@/core/middlewares/namespace.middleware';
import { zValidator } from '@/core/middlewares/validator.middleware';

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
const validateNamespaceHeaders = zValidator('header', NamespaceHeadersSchema);

source.use('*', authenticate);
source.use('*', sentryMiddleware);
source.use('*', validateNamespaceHeaders);
source.use('*', requireWorkspaceMembership(['owner', 'admin', 'member']));
source.use('*', requireNamespaceAccess());

source.post(
    '/',
    sourceWriteRateLimiter,
    zValidator('json', CreateSourceSchema),
    SourceController.createSource
);

source.get(
    '/',
    sourceReadRateLimiter,
    zValidator('query', SearchSourceSchema),
    SourceController.getSources
);

source.get(
    '/:sourceId',
    sourceReadRateLimiter,
    zValidator('param', GetSourceByIdSchema),
    SourceController.getSource
);

source.patch(
    '/:sourceId',
    sourceWriteRateLimiter,
    zValidator('param', GetSourceByIdSchema),
    zValidator('json', UpdateSourceSchema),
    SourceController.updateSource
);

source.put(
    '/:sourceId/auth',
    sourceWriteRateLimiter,
    zValidator('param', GetSourceByIdSchema),
    zValidator('json', UpdateSourceAuthSchema),
    SourceController.updateSourceAuth
);

source.delete(
    '/:sourceId',
    sourceWriteRateLimiter,
    zValidator('param', GetSourceByIdSchema),
    SourceController.deleteSource
);
export default source;
