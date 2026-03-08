import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { requireRecentOTP } from '@/core/middlewares/otp.middleware';

import { checkScopeSchema, createAPIKeySchema, getKeysSchema, revokeKeyById } from './key.schema';
import { KeyController } from '@/modules/v1/key/key.controller';
import { keyManagementRateLimiter } from './key.rate-limiter';

const key = new Hono();

key.use(authenticate);
key.use(requireWorkspaceMembership(['owner', 'admin', 'member']));

// POST /key/keys - Create a new API key
key.post(
    '/',
    keyManagementRateLimiter,
    zValidator('json', createAPIKeySchema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: JSON.parse(result.error.message).map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
    }),
    requireRecentOTP('manage_keys'),
    KeyController.createKey
);

key.get(
    '/',
    keyManagementRateLimiter,
    zValidator('query', getKeysSchema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: JSON.parse(result.error.message).map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
    }),
    KeyController.getKeysSchema
);

key.get(
    '/check-scopes/:keyId',
    keyManagementRateLimiter,
    zValidator('param', checkScopeSchema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: JSON.parse(result.error.message).map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
    }),
    KeyController.checkScopes
);

key.delete(
    '/:keyId',
    keyManagementRateLimiter,
    zValidator('param', revokeKeyById, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: JSON.parse(result.error.message).map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
    }),
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
