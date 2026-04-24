import { Hono } from 'hono';
import { validate } from '@/core/middlewares/validator.middleware';
import { authenticate, AppContext } from '@/core/middlewares/auth.middleware';
import { sentryMiddleware } from '@/core/middlewares/sentry.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { requireNamespaceAccess } from '@/core/middlewares/namespace.middleware';
import { NamespaceHeadersSchema } from '@/core/utils/libs/zod';
import { EndpointController } from './endpoint.controller';
import { CreateEndpointDto, UpdateEndpointDto, GetEndpointByIdSchema } from './endpoint.schema';

const endpoint = new Hono();

// Header validation
const validateNamespaceHeaders = validate('header', NamespaceHeadersSchema);

endpoint.use('*', authenticate);
endpoint.use('*', sentryMiddleware);
endpoint.use('*', validateNamespaceHeaders);
endpoint.use('*', requireWorkspaceMembership(['owner', 'admin', 'member']));
endpoint.use('*', requireNamespaceAccess());

endpoint.post(
    '/',
    validate('json', CreateEndpointDto),
    EndpointController.createEndpoint
);

endpoint.get(
    '/',
    EndpointController.getEndpoints
);

endpoint.get(
    '/:endpointId',
    validate('param', GetEndpointByIdSchema),
    EndpointController.getEndpoint
);

endpoint.get(
    '/:endpointId/secret',
    validate('param', GetEndpointByIdSchema),
    EndpointController.getEndpointSecret
);

endpoint.patch(
    '/:endpointId',
    validate('param', GetEndpointByIdSchema),
    validate('json', UpdateEndpointDto),
    EndpointController.updateEndpoint
);

endpoint.delete(
    '/:endpointId',
    validate('param', GetEndpointByIdSchema),
    EndpointController.deleteEndpoint
);

export default endpoint;
