import { type Context } from 'hono';
import { v4 as uuidv4 } from 'uuid';

import { redisConfig } from '@/configs';
import { logger, mapToObject, PerformanceTimer, snowflake } from '@kyrazo/shared';
import { type IErrorResponse, type IReceivedEvent, Source, unprefixId } from '@kyrazo/shared';
import { receiveEventPublisher } from '@/producers/jobs/v1/publishers';
import { usageProducer } from '@/core/services/usage.producer';
import { LimitChecker } from '@/core/services/limit.checker';
import type { ingestInput } from './ingest.schema';
import { getServiceFilter } from './service';

export class ingestController {
    static async receiveEvent(c: Context) {
        const timer = new PerformanceTimer('event_received');
        try {
            // Extract the ingress endpoint ID from the URL parameter
            // @ts-ignore
            const { IEId, service }: ingestInput = c.req.valid('param');

            if (!IEId) {
                return c.json(
                    {
                        success: false,
                        error: {
                            code: 'INVALID_INGRESS_ID',
                            message: 'Ingress Endpoint ID is required',
                        },
                    },
                    400
                );
            }

            // Look up the IngressEndpoint to get user and workspace details
            const source = await redisConfig.cache(
                `source:ingest:${IEId}`,
                async () => {
                    return await Source.findOne({
                        ingressId: IEId,
                        status: 'active',
                    });
                },
                60 * 60 * 24
            );

            if (!source || source.status !== 'active') {
                return c.json(
                    {
                        success: false,
                        error: {
                            code: 'WEBHOOK_NOT_FOUND',
                            message: 'Source not found or inactive',
                        },
                    },
                    404
                );
            }

            if (service && source.service && source.service !== service) {
                return c.json(
                    {
                        success: false,
                        error: {
                            code: 'INVALID_ENDPOINT_SERVICE',
                            message: `Endpoint is not configured for ${service.charAt(0).toUpperCase() + String(service).slice(1)}`,
                        },
                    },
                    400
                );
            }

            // Check limits
            const canProceed = await LimitChecker.checkEventLimit(source.workspaceId.toString());
            if (!canProceed) {
                return c.json(
                    {
                        success: false,
                        error: {
                            code: 'LIMIT_EXCEEDED',
                            message: 'Monthly event limit exceeded',
                        },
                    },
                    403
                );
            }

            // Extract request details
            const headers = c.req.header();
            const contentType = headers['content-type'];
            const rawBody = await c.req.text();
            let body: any = {};

            try {
                if (contentType?.includes('application/x-www-form-urlencoded')) {
                    const params = new URLSearchParams(rawBody);
                    const payload = params.get('payload');
                    if (payload) {
                        body = JSON.parse(payload);
                    } else {
                        // Fallback: convert all params to object
                        body = Object.fromEntries(params.entries());
                    }
                } else {
                    body = JSON.parse(rawBody);
                }
            } catch (e) {
                // Keep body empty or partial if parsing fails
            }

            // Filter by event types if configured
            if (source.eventTypes && source.eventTypes.length > 0) {
                const serviceFilter = getServiceFilter(service || source.service);
                if (serviceFilter) {
                    const eventType = serviceFilter.getEventType(body, headers);
                    if (eventType && !source.eventTypes.includes(eventType)) {
                        return c.json(
                            {
                                success: true,
                                data: {
                                    message: 'Event filtered out',
                                },
                            },
                            200
                        );
                    }
                }
            }

            const sourceIdStr = (source.id || source._id).toString();
            const workspaceIdStr = source.workspaceId.toString();
            const namespaceIdStr = source.namespaceId.toString();
            const userIdStr = source.userId.toString();

            const shard = parseInt(unprefixId(workspaceIdStr)!.slice(-6), 16) % 10;

            const planSlug = await redisConfig.get(`workspace:${unprefixId(workspaceIdStr)}`);

            // Create the received event data
            const receivedEventData: IReceivedEvent & {
                shard?: number;
                planSlug: string;
            } = {
                planSlug: planSlug ? JSON.parse(planSlug).planSlug : 'free',
                eventId: snowflake.generate(),
                source: service ? service : source.service,
                sourceType: 'receive',
                sourceId: sourceIdStr,
                workspaceId: workspaceIdStr,
                namespaceId: namespaceIdStr,
                ingressId: source.ingressId,
                userId: userIdStr,

                receivedAt: new Date(),
                headers: mapToObject(new Map(Object.entries(headers))),
                body: body,
                rawBody: rawBody,

                processingStatus: 'pending',
                associatedEventId: undefined,
                shard: shard,
            };
            const receivedEventResult = await receiveEventPublisher.receive(receivedEventData);

            if (!receivedEventResult.success) {
                throw new Error('Failed to publish receive event to NATS');
            }

            // Track usage asynchronously
            usageProducer.trackEvent(
                workspaceIdStr,
                undefined, // subscriptionId not available here, consumer will resolve
                'eventsPerMonth',
                1
            );

            const duration = timer.end();

            return c.json(
                {
                    success: true,
                    data: {
                        message: 'Event received and stored successfully',
                    },
                },
                200
            );
        } catch (error: any) {
            timer.end();
            logger.error(
                'Error receiving event:',
                error instanceof Error ? { message: error.message, stack: error.stack } : error
            );

            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'RECEIVED_EVENT_FAILED',
                        message: 'Failed to process received event',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
}
