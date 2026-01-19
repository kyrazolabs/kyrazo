import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authenticate, checkScope } from '@/core/middlewares/auth.middleware';
import {
    CreateEndpointSchema,
    GetEndpointByIdSchema,
    SearchEndpointSchema,
    UpdateEndpointSchema,
    UpdateEndpointStatusSchema,
} from './endpoint.schema';
import { EndpointController } from './endpoint.controller';
import { GetProjectByIdSchema } from '@/core/utils/libs/zod';

const endpoint = new Hono();

endpoint.post(
    '/:projectId',
    authenticate,
    checkScope('dispatch:endpoint:create'),
    zValidator('param', GetProjectByIdSchema),
    zValidator('json', CreateEndpointSchema),
    EndpointController.createEndpoint
);

endpoint.get(
    '/:projectId',
    authenticate,
    checkScope('dispatch:endpoint:read'),
    zValidator('param', GetProjectByIdSchema),
    zValidator('query', SearchEndpointSchema),
    EndpointController.getEndpoints
);

endpoint.get(
    '/:projectId/:endpointId',
    authenticate,
    checkScope('dispatch:endpoint:read'),
    zValidator(
        'param',
        GetProjectByIdSchema.extend(GetEndpointByIdSchema.shape)
    ),
    EndpointController.getEndpoint
);

endpoint.get(
    '/:projectId/:endpointId/secret',
    authenticate,
    checkScope('dispatch:endpoint:read'),
    zValidator(
        'param',
        GetProjectByIdSchema.extend(GetEndpointByIdSchema.shape)
    ),
    EndpointController.getEndpointSecret
);

endpoint.patch(
    '/:projectId/:endpointId',
    authenticate,
    checkScope('dispatch:endpoint:update'),
    zValidator(
        'param',
        GetProjectByIdSchema.extend(GetEndpointByIdSchema.shape)
    ),
    zValidator('json', UpdateEndpointSchema),
    EndpointController.updateEndpoint
);

endpoint.put(
    '/:projectId/:endpointId',
    authenticate,
    checkScope('dispatch:endpoint:update'),
    zValidator(
        'param',
        GetProjectByIdSchema.extend(GetEndpointByIdSchema.shape)
    ),
    zValidator('json', UpdateEndpointStatusSchema),
    EndpointController.updateEndpoint
);

endpoint.delete(
    '/:projectId/:endpointId',
    authenticate,
    checkScope('dispatch:endpoint:delete'),
    zValidator(
        'param',
        GetProjectByIdSchema.extend(GetEndpointByIdSchema.shape)
    ),
    EndpointController.deleteEndpoint
);

export default endpoint;
