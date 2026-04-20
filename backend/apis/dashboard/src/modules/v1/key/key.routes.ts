import { Hono } from 'hono';
import { validate } from '@/core/middlewares/validator.middleware';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { requireRecentOTP } from '@/core/middlewares/otp.middleware';

import { checkScopeSchema, createAPIKeySchema, getKeysSchema, revokeKeyById } from './key.schema';
import { KeyController } from '@/modules/v1/key/key.controller';
import { keyManagementRateLimiter } from './key.ratelimiter';

const key = new Hono();

key.use(authenticate);
key.use(requireWorkspaceMembership(['owner', 'admin', 'member']));

// POST /key/keys - Create a new API key
key.post(
    '/',
    keyManagementRateLimiter,
    validate('json', createAPIKeySchema),
    requireRecentOTP('manage_keys'),
    KeyController.createKey
);

key.get(
    '/',
    keyManagementRateLimiter,
    validate('query', getKeysSchema),
    KeyController.getKeysSchema
);

key.get(
    '/check-scopes/:keyId',
    keyManagementRateLimiter,
    validate('param', checkScopeSchema),
    KeyController.checkScopes
);

key.delete(
    '/:keyId',
    keyManagementRateLimiter,
    validate('param', revokeKeyById),
    requireRecentOTP('manage_keys'),
    KeyController.deleteKey
);

// --- Example of a route protected by API key ---

// GET /key/protected-data
key.get('/protected-data', keyManagementRateLimiter, c => {
    const apiKey = c.get('apiKey');
    return c.json({
        message: 'You are authorized to access this protected data.',
        data: {
            owner: apiKey?.owner,
            scopes: apiKey?.scopes,
        },
    });
});

export default key;
