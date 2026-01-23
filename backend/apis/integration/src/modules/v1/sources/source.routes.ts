import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authenticate, checkScope } from '@/core/middlewares/auth.middleware';
import {
    CreateSourceSchema,
    GetSourceByIdSchema,
    SearchSourceSchema,
    UpdateSourceSchema,
} from './source.schema';
import { SourceController } from './source.controller';
import { GetProjectByIdSchema } from '@/core/utils/libs/zod';

const source = new Hono();

source.post(
    '/:projectId',
    authenticate,
    checkScope('ingest:source:create'),
    zValidator('param', GetProjectByIdSchema),
    zValidator('json', CreateSourceSchema),
    SourceController.createSource
);

source.get(
    '/:projectId',
    authenticate,
    checkScope('ingest:source:read'),
    zValidator('param', GetProjectByIdSchema),
    zValidator('query', SearchSourceSchema),
    SourceController.getSources
);

source.get(
    '/:projectId/:sourceId',
    authenticate,
    checkScope('ingest:source:read'),
    zValidator('param', GetProjectByIdSchema.extend(GetSourceByIdSchema.shape)),
    SourceController.getSource
);

source.patch(
    '/:projectId/:sourceId',
    authenticate,
    checkScope('ingest:source:update'),
    zValidator('param', GetProjectByIdSchema.extend(GetSourceByIdSchema.shape)),
    zValidator('json', UpdateSourceSchema),
    SourceController.updateSource
);

source.delete(
    '/:projectId/:sourceId',
    authenticate,
    checkScope('ingest:source:delete'),
    zValidator('param', GetProjectByIdSchema.extend(GetSourceByIdSchema.shape)),
    SourceController.deleteSource
);

export default source;
