import { Hono } from 'hono';
import { NamespaceHeadersSchema } from '@kyrazo/shared';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { sentryMiddleware } from '@/core/middlewares/sentry.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { requireNamespaceAccess } from '@/core/middlewares/namespace.middleware';
import { zValidator } from '@/core/middlewares/validator.middleware';
import { S3Controller } from './s3.controller';
import {
    CreateS3Schema,
    UpdateS3Schema,
    S3IdParamSchema,
    TestS3ConnectionSchema,
} from './s3.schema';

const s3 = new Hono();

// Header validation matching v2 transforms style
const validateNamespaceHeaders = zValidator('header', NamespaceHeadersSchema);

s3.use('*', authenticate);
s3.use('*', sentryMiddleware);
s3.use('*', validateNamespaceHeaders);
s3.use('*', requireWorkspaceMembership(['owner', 'admin', 'member']));
s3.use('*', requireNamespaceAccess());

// GET /s3 → List all buckets
s3.get('/', S3Controller.getS3Buckets);

// POST /s3 → Create new bucket
s3.post('/', zValidator('json', CreateS3Schema), S3Controller.createS3Bucket);

// GET /s3/:id → Get single bucket
s3.get('/:id', zValidator('param', S3IdParamSchema), S3Controller.getS3Bucket);

// PUT /s3/:id → Update bucket
s3.put(
    '/:id',
    zValidator('param', S3IdParamSchema),
    zValidator('json', UpdateS3Schema),
    S3Controller.updateS3Bucket
);

// DELETE /s3/:id → Delete bucket
s3.delete('/:id', zValidator('param', S3IdParamSchema), S3Controller.deleteS3Bucket);

// POST /test → Test connection
s3.post('/test', zValidator('json', TestS3ConnectionSchema), S3Controller.testConnection);

export default s3;
