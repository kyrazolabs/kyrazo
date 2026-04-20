import { Hono } from 'hono';
import { validate } from '@/core/middlewares/validator.middleware';
import { authenticate, checkScope } from '@/core/middlewares/auth.middleware';
import {
    CreateEndpointSchema,
    GetEndpointByIdSchema,
    SearchEndpointSchema,
    UpdateEndpointSchema,
    UpdateEndpointStatusSchema,
} from './endpoint.schema';
import { EndpointController } from './endpoint.controller';
import { GetNamespaceByIdSchema } from '@/core/utils/libs/zod';

const endpoint = new Hono();

endpoint.post(
    '/:namespaceId',
    authenticate,
    checkScope('ingest:endpoint:create'),
    validate('param', GetNamespaceByIdSchema),
    validate('json', CreateEndpointSchema),
    EndpointController.createEndpoint
);

endpoint.get(
    '/:namespaceId',
    authenticate,
    checkScope('ingest:endpoint:read'),
    validate('param', GetNamespaceByIdSchema),
    validate('query', SearchEndpointSchema),
    EndpointController.getEndpoints
);

endpoint.get(
    '/:namespaceId/:endpointId',
    authenticate,
    checkScope('ingest:endpoint:read'),
    validate('param', GetNamespaceByIdSchema.extend(GetEndpointByIdSchema.shape)),
    EndpointController.getEndpoint
);

endpoint.get(
    '/:namespaceId/:endpointId/secret',
    authenticate,
    checkScope('ingest:endpoint:read'),
    validate('param', GetNamespaceByIdSchema.extend(GetEndpointByIdSchema.shape)),
    EndpointController.getEndpointSecret
);

endpoint.patch(
    '/:namespaceId/:endpointId',
    authenticate,
    checkScope('ingest:endpoint:update'),
    validate('param', GetNamespaceByIdSchema.extend(GetEndpointByIdSchema.shape)),
    validate('json', UpdateEndpointSchema),
    EndpointController.updateEndpoint
);

endpoint.put(
    '/:namespaceId/:endpointId',
    authenticate,
    checkScope('ingest:endpoint:update'),
    validate('param', GetNamespaceByIdSchema.extend(GetEndpointByIdSchema.shape)),
    validate('json', UpdateEndpointStatusSchema),
    EndpointController.updateEndpoint
);

endpoint.delete(
    '/:namespaceId/:endpointId',
    authenticate,
    checkScope('ingest:endpoint:delete'),
    validate('param', GetNamespaceByIdSchema.extend(GetEndpointByIdSchema.shape)),
    EndpointController.deleteEndpoint
);

export default endpoint;
