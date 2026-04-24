import type { Next } from 'hono';
import { redisConfig } from '@/configs';
import type { AppContext } from './auth.middleware';
import { type IErrorResponse, RedisKeys } from '@kyrazo/shared';

export const idempotencyMiddleware = async (c: AppContext, next: Next) => {
    const key = c.req.header('Idempotency-Key');
    const workspaceId = c.workspace?.workspaceId;

    if (!key || !workspaceId) {
        return c.json<IErrorResponse>(
            {
                success: false,
                error: {
                    code: 'IDEMPOTENCY_KEY_REQUIRED',
                    message: 'Idempotency-Key required',
                    requestId: c.get('requestId'),
                },
            },
            400
        );
    }

    const redisKey = RedisKeys.idempotency.key(workspaceId.toString(), c.req.path, key);

    const exists = await redisConfig.get(redisKey);
    if (exists) {
        const data = JSON.parse(exists);

        if (data.status === 'completed') {
            return c.json(
                {
                    success: true,
                    message: 'Request already completed',
                    data: data.response,
                },
                200
            );
        } else if (data.status === 'failed') {
            return c.json(
                {
                    success: true,
                    message: 'Request already failed',
                    data: data.error,
                },
                200
            );
        }

        return c.json<IErrorResponse>(
            {
                success: false,
                error: {
                    code: 'IDEMPOTENCY_CONFLICT',
                    message: 'Request already in progress',
                    requestId: c.get('requestId'),
                },
            },
            409
        );
    }

    await redisConfig.set(
        redisKey,
        JSON.stringify({ status: 'processing', response: {} }),
        60 * 60 * 24
    );

    c.idempotencyKey = key;

    await next();
};
