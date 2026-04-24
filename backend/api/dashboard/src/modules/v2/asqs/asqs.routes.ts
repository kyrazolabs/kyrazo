import { Hono } from 'hono';
import { NamespaceHeadersSchema } from '@kyrazo/shared';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { sentryMiddleware } from '@/core/middlewares/sentry.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { requireNamespaceAccess } from '@/core/middlewares/namespace.middleware';
import { validate } from '@/core/middlewares/validator.middleware';
import { ASQSController } from './asqs.controller';
import {
    CreateASQSSchema,
    UpdateASQSSchema,
    ASQSIdParamSchema,
    TestASQSConnectionSchema,
} from './asqs.schema';

const asqs = new Hono();

// Header validation matching v2 transforms style
const validateNamespaceHeaders = validate('header', NamespaceHeadersSchema);

asqs.use('*', authenticate);
asqs.use('*', sentryMiddleware);
asqs.use('*', validateNamespaceHeaders);
asqs.use('*', requireWorkspaceMembership(['owner', 'admin', 'member']));
asqs.use('*', requireNamespaceAccess());

// GET /asqs → List all
asqs.get('/', ASQSController.getASQSs);

// POST /asqs → Create
asqs.post('/', validate('json', CreateASQSSchema), ASQSController.createASQS);

// GET /asqs/:id → Get single
asqs.get('/:id', validate('param', ASQSIdParamSchema), ASQSController.getASQS);

// PATCH /asqs/:id → Update
asqs.patch(
    '/:id',
    validate('param', ASQSIdParamSchema),
    validate('json', UpdateASQSSchema),
    ASQSController.updateASQS
);

// DELETE /asqs/:id → Delete
asqs.delete('/:id', validate('param', ASQSIdParamSchema), ASQSController.deleteASQS);

// POST /test → Test connection
asqs.post('/test', validate('json', TestASQSConnectionSchema), ASQSController.testConnection);

export default asqs;
