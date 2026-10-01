import { Hono } from 'hono';
import { validator } from '@/core/middlewares/validator.middleware';
import { authenticate, checkScope } from '@/core/middlewares/auth.middleware';
import {
    CreateSourceSchema,
    GetSourceByIdSchema,
    SearchSourceSchema,
    UpdateSourceSchema,
} from './source.schema';
import { SourceController } from './source.controller';
import { GetNamespaceByIdSchema } from '@/core/utils/libs/zod';

const source = new Hono();

source.post(
    '/:namespaceId',
    authenticate,
    checkScope('ingest:source:create'),
    validator('param', GetNamespaceByIdSchema),
    validator('json', CreateSourceSchema),
    SourceController.createSource
);

source.get(
    '/:namespaceId',
    authenticate,
    checkScope('ingest:source:read'),
    validator('param', GetNamespaceByIdSchema),
    validator('query', SearchSourceSchema),
    SourceController.getSources
);

source.get(
    '/:namespaceId/:sourceId',
    authenticate,
    checkScope('ingest:source:read'),
    validator('param', GetNamespaceByIdSchema.extend(GetSourceByIdSchema.shape)),
    SourceController.getSource
);

source.patch(
    '/:namespaceId/:sourceId',
    authenticate,
    checkScope('ingest:source:update'),
    validator('param', GetNamespaceByIdSchema.extend(GetSourceByIdSchema.shape)),
    validator('json', UpdateSourceSchema),
    SourceController.updateSource
);

source.delete(
    '/:namespaceId/:sourceId',
    authenticate,
    checkScope('ingest:source:delete'),
    validator('param', GetNamespaceByIdSchema.extend(GetSourceByIdSchema.shape)),
    SourceController.deleteSource
);

export default source;
