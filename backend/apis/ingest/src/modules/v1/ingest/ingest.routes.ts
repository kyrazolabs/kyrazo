import { Hono, Context } from 'hono';
import z from 'zod';
import { zValidator } from '@hono/zod-validator';
import { ingestController } from './ingest.controller';
import { logger, redisConfig } from '@/configs';
import {
    getIngestRateLimiter,
    createWorkspaceRateLimiter,
} from '@/core/middlewares/rate-limiter.middleware';
import { Source } from '@kyrazo/shared';

// Helper to resolve IEId to WorkspaceId
const resolveWorkspaceId = async (c: Context): Promise<string | undefined> => {
    const { IEId } = c.req.valid('param');
    if (!IEId) return undefined;

    // Try to get from cache first
    const endpoint = await redisConfig.cache(
        `source:ingest:${IEId}`,
        async () => {
            return await Source.findOne({
                ingressId: IEId,
                status: 'active',
            });
        },
        60 * 60 * 24 // 24 hours
    );

    return endpoint?.workspaceId?.toString();
};

const ingest = new Hono();

ingest.post('/', getIngestRateLimiter(), async (c: Context) => {
    const headers = c.req.header();
    const body = await c.req.json().catch(() => ({}));

    logger.debug('received headers :' + JSON.stringify(headers));
    logger.debug('received body :' + JSON.stringify(body));

    return c.json({ success: true }, 200);
});

ingest.post(
    '/:service/:IEId',
    zValidator(
        'param',
        z.object({
            service: z.string('Invalid service').min(5, 'Service is required'),
            IEId: z
                .string('Invalid Ingress Endpoint')
                .min(5, 'Ingress Endpoint is required'),
        }),
        (result, c) => {
            if (!result.success) {
                return c.json(
                    {
                        success: false,
                        statusCode: 400,
                        errors: JSON.parse(result.error.message).map(
                            (e: any) => ({
                                field: e.path.join('.') || 'unknown',
                                message: e.message,
                            })
                        ),
                    },
                    400
                );
            }
        }
    ),

    createWorkspaceRateLimiter(resolveWorkspaceId),
    ingestController.receiveEvent
);

ingest.post(
    '/:IEId',
    zValidator(
        'param',
        z.object({
            IEId: z
                .string('Invalid Ingress Endpoint')
                .min(5, 'Ingress Endpoint is required'),
        }),
        (result, c) => {
            if (!result.success) {
                return c.json(
                    {
                        success: false,
                        statusCode: 400,
                        errors: JSON.parse(result.error.message).map(
                            (e: any) => ({
                                field: e.path.join('.') || 'unknown',
                                message: e.message,
                            })
                        ),
                    },
                    400
                );
            }
        }
    ),

    createWorkspaceRateLimiter(resolveWorkspaceId),
    ingestController.receiveEvent
);

export default ingest;
