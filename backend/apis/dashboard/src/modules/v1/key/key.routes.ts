import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { AppContext, authenticate } from '@/core/middlewares/auth.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';

import { config } from '@/configs/app';
import {
    createSlidingWindowLimiter,
    createRateLimitMiddleware,
} from '@/core/middlewares/rate-limiter.middleware';

import {
    checkScopeSchema,
    createAPIKeySchema,
    getKeysSchema,
    revokeKeyById,
} from './key.schema';
import { KeyController } from '@/modules/v1/key/key.controller';

const key = new Hono();

// Lazy wrapper for API key management rate limiter (user-based, sensitive operations)
const keyManagementRateLimiter = async (
    c: AppContext,
    next: () => Promise<void>
) => {
    const limiter = createRateLimitMiddleware(
        createSlidingWindowLimiter({
            points: config.security.rateLimiter.protected.sensitive.points,
            duration: config.security.rateLimiter.protected.sensitive.duration,
            blockDuration:
                config.security.rateLimiter.protected.sensitive.blockDuration,
        }),
        c =>
            config.security.rateLimiter.protected.sensitive.keyPrefix(
                (c as any).user.userId
            ),
        'Too many API key management requests'
    );
    return limiter(c, next);
};

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
