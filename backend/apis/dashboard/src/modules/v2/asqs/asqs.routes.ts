import { Hono } from 'hono';
import { NamespaceHeadersSchema } from '@kyrazo/shared';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { sentryMiddleware } from '@/core/middlewares/sentry.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { requireNamespaceAccess } from '@/core/middlewares/namespace.middleware';
import { zValidator } from '@/core/middlewares/validator.middleware';
import { ASQSController } from './asqs.controller';
import {
    CreateASQSSchema,
    UpdateASQSSchema,
    ASQSIdParamSchema,
    TestASQSConnectionSchema,
} from './asqs.schema';

const asqs = new Hono();

// Header validation matching v2 transforms style
const validateNamespaceHeaders = zValidator('header', NamespaceHeadersSchema);

asqs.use('*', authenticate);
asqs.use('*', sentryMiddleware);
asqs.use('*', validateNamespaceHeaders);
asqs.use('*', requireWorkspaceMembership(['owner', 'admin', 'member']));
asqs.use('*', requireNamespaceAccess());

// GET /asqs → List all
asqs.get('/', ASQSController.getASQSs);

// POST /asqs → Create
asqs.post('/', zValidator('json', CreateASQSSchema), ASQSController.createASQS);

// GET /asqs/:id → Get single
asqs.get('/:id', zValidator('param', ASQSIdParamSchema), ASQSController.getASQS);

// PUT /asqs/:id → Update
asqs.put(
    '/:id',
    zValidator('param', ASQSIdParamSchema),
    zValidator('json', UpdateASQSSchema),
    ASQSController.updateASQS
);

// DELETE /asqs/:id → Delete
asqs.delete('/:id', zValidator('param', ASQSIdParamSchema), ASQSController.deleteASQS);

// POST /test → Test connection
asqs.post('/test', zValidator('json', TestASQSConnectionSchema), ASQSController.testConnection);

export default asqs;
