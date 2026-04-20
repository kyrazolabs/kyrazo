import { Hono } from 'hono';
import { validate } from '@/core/middlewares/validator.middleware';
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
    validate('param', GetNamespaceByIdSchema),
    validate('json', CreateSourceSchema),
    SourceController.createSource
);

source.get(
    '/:namespaceId',
    authenticate,
    checkScope('ingest:source:read'),
    validate('param', GetNamespaceByIdSchema),
    validate('query', SearchSourceSchema),
    SourceController.getSources
);

source.get(
    '/:namespaceId/:sourceId',
    authenticate,
    checkScope('ingest:source:read'),
    validate('param', GetNamespaceByIdSchema.extend(GetSourceByIdSchema.shape)),
    SourceController.getSource
);

source.patch(
    '/:namespaceId/:sourceId',
    authenticate,
    checkScope('ingest:source:update'),
    validate('param', GetNamespaceByIdSchema.extend(GetSourceByIdSchema.shape)),
    validate('json', UpdateSourceSchema),
    SourceController.updateSource
);

source.delete(
    '/:namespaceId/:sourceId',
    authenticate,
    checkScope('ingest:source:delete'),
    validate('param', GetNamespaceByIdSchema.extend(GetSourceByIdSchema.shape)),
    SourceController.deleteSource
);

export default source;
