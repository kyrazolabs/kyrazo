import type { AppContext } from '@/core/middlewares/auth.middleware';
import { redisConfig } from '@/configs';
import { PerformanceTimer } from '@/core/utils';
import { logger, type IErrorResponse, snowflake, RedisKeys } from '@kyrazo/shared';
import { publishEventPublisher } from '@/producers/jobs/v1/publishers';
import type {
    BatchCreatePublishedEvent,
    BatchPublishedEventInput,
    CreatePublishedEvent,
    PublishedEventInput,
    TargetInput,
} from './event.schema';
import { usageProducer } from '@/core/services/usage.producer';
import { LimitChecker } from '@/core/services/limit.checker';
import { targetRepository } from '@/modules/v1/targets/target.repo';
import { unprefixId } from '@kyrazo/shared';
import type { GetNamespaceByIdInput } from '@/core/utils/libs/zod';

export class EventController {
    /**
     * Checks if targets exist in cache or database.
     * Scaleable approach using a hybrid cache (Redis + In-memory during request).
     */
    private static async checkTargetsExsisting(
        workspaceId: string,
        namespaceId: string,
        targets: string[]
    ): Promise<{
        foundTargets: { targetId: string; targetUrl: string }[];
        unfoundTargets: string[];
    }> {
        const cacheKey = RedisKeys.context.workspaceNamespaceTargets(workspaceId, namespaceId);
        const normalizedInputTargets = targets.map(id => unprefixId(id)!);

        // 1. Try to get it from the cache
        const cachedData = await redisConfig.get(cacheKey);
        let cachedTargets: any[] = cachedData ? JSON.parse(cachedData) : [];
        const isCacheMiss = !cachedData;

        // 2. Split: Found in cache / Missing
        const cachedMap = new Map(
            cachedTargets.map((t: any) => {
                const id = t.id || t.targetId || `trg_${t._id?.toString()}`;
                return [unprefixId(id as string), t];
            })
        );
        const missingFromCache = normalizedInputTargets.filter(id => !cachedMap.has(id));

        // 3. Retrieve missing information from the database or update cache if stale
        if (isCacheMiss || missingFromCache.length > 0) {
            let fetchedTargets: any[] = [];
            if (missingFromCache.length > 0) {
                fetchedTargets =
                    await targetRepository.getTargetsByWorkspaceIdAndNamespaceIdAndTargetIds(
                        workspaceId,
                        namespaceId,
                        missingFromCache
                    );
            }

            // Merge cache with retrieved data and update cache
            const allTargets = [
                ...cachedTargets,
                ...fetchedTargets.filter(t => {
                    const id = t.id || t.targetId || `trg_${t._id?.toString()}`;
                    return !cachedMap.has(unprefixId(id as string));
                }),
            ];

            await redisConfig.set(cacheKey, JSON.stringify(allTargets), 60 * 60 * 10);

            cachedTargets = allTargets;
        }

        const foundTargets: { targetId: string; targetUrl: string }[] = [];
        const foundSet = new Set<string>();

        cachedTargets.forEach((t: any) => {
            const id = (t.id || t.targetId || t._id?.toString()) as string;
            const normalizedId = unprefixId(id)!;
            if (normalizedInputTargets.includes(normalizedId)) {
                foundTargets.push({
                    targetId: id,
                    targetUrl: (t.url || t.targetUrl) as string,
                });
                foundSet.add(normalizedId);
            }
        });

        const unfoundTargets = targets.filter(id => !foundSet.has(unprefixId(id)!));

        return { foundTargets, unfoundTargets };
    }

    /**
     * Publishes a single event.
     * Supports idempotency and usage tracking.
     */
    static async publishEvent(c: AppContext): Promise<Response> {
        const timer = new PerformanceTimer('event_creation');
        try {
            const idempotencyKey = c.idempotencyKey;
            const workspaceId = c.workspace?.workspaceId;

            // @ts-ignore - Hono type inference issues
            const param: GetNamespaceByIdInput = c.req.valid('param');
            const namespaceId = unprefixId(param.namespaceId)!;

            // @ts-ignore
            const valid = c.req.valid('json') as PublishedEventInput;

            if (!workspaceId || !namespaceId) {
                const errorResponse: IErrorResponse = {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                        requestId: c.get('requestId'),
                    },
                };

                if (idempotencyKey && workspaceId) {
                    await redisConfig.set(
                        RedisKeys.idempotency.key(
                            workspaceId.toString(),
                            c.req.path,
                            idempotencyKey
                        ),
                        JSON.stringify({ status: 'failed', error: errorResponse.error }),
                        60 * 30 // Cache for 30 Minute
                    );
                }

                return c.json<IErrorResponse>(errorResponse, 401);
            }

            const shard = parseInt(workspaceId.toString().slice(-6), 16) % 10;
            const eventId = snowflake.generate();

            const data: CreatePublishedEvent = {
                ...valid,
                eventId,
                workspaceId: workspaceId.toString(),
                namespaceId,
                sourceType: 'publish',
                timestamp: Date.now(),
                shard,
            } as any;

            const { foundTargets, unfoundTargets } = await EventController.checkTargetsExsisting(
                workspaceId.toString(),
                namespaceId,
                valid.targets.map(t => t.targetId!)
            );

            if (foundTargets.length === 0) {
                const errorResponse: IErrorResponse = {
                    success: false,
                    error: {
                        code: 'NO_VALID_TARGETS',
                        message: 'No valid targets found for this event',
                        details: { unfoundTargets },
                        requestId: c.get('requestId'),
                    },
                };

                if (idempotencyKey) {
                    await redisConfig.set(
                        RedisKeys.idempotency.key(
                            workspaceId!.toString(),
                            c.req.path,
                            idempotencyKey
                        ),
                        JSON.stringify({ status: 'failed', error: errorResponse.error }),
                        60 * 30 // Cache for 30 Minute
                    );
                }

                return c.json<IErrorResponse>(errorResponse, 400);
            }

            data.targets = foundTargets as any;

            // Check limits
            const canProceed = await LimitChecker.checkEventLimit(workspaceId.toString());
            if (!canProceed) {
                const errorResponse: IErrorResponse = {
                    success: false,
                    error: {
                        code: 'LIMIT_EXCEEDED',
                        message: 'Monthly event limit exceeded',
                        requestId: c.get('requestId'),
                    },
                };

                if (idempotencyKey) {
                    await redisConfig.set(
                        RedisKeys.idempotency.key(
                            workspaceId!.toString(),
                            c.req.path,
                            idempotencyKey
                        ),
                        JSON.stringify({ status: 'failed', error: errorResponse.error }),
                        60 * 30 // Cache for 30 Minute
                    );
                }

                return c.json<IErrorResponse>(errorResponse, 403);
            }

            const planSlugRaw = await redisConfig.get(
                RedisKeys.billing.workspacePlan(workspaceId.toString())
            );
            const planSlug = planSlugRaw ? JSON.parse(planSlugRaw).planSlug : 'free';

            const publishResult = await publishEventPublisher.publish({
                ...data,
                planSlug,
            });

            if (!publishResult) {
                const errorResponse: IErrorResponse = {
                    success: false,
                    error: {
                        code: 'PUBLISH_EVENT_FAILED',
                        message: 'Failed to publish event',
                        requestId: c.get('requestId'),
                    },
                };

                if (idempotencyKey) {
                    await redisConfig.set(
                        RedisKeys.idempotency.key(
                            workspaceId!.toString(),
                            c.req.path,
                            idempotencyKey
                        ),
                        JSON.stringify({ status: 'failed', error: errorResponse.error }),
                        60 * 30 // Cache for 30 Minute
                    );
                }

                return c.json<IErrorResponse>(errorResponse, 500);
            }

            const duration = timer.end();
            usageProducer.trackEvent(workspaceId.toString(), undefined, 'eventsPerMonth', 1);

            const successResponse = {
                status: 'queued',
                eventId: publishResult.eventId,
                targetsCount: publishResult.targetsCount,
                unfoundTargets,
                queuedAt: new Date().toISOString(),
                processingTimeMs: Math.round(duration),
            };

            if (idempotencyKey && workspaceId) {
                await redisConfig.set(
                    RedisKeys.idempotency.key(workspaceId.toString(), c.req.path, idempotencyKey),
                    JSON.stringify({ status: 'completed', response: successResponse }),
                    60 * 30 // Cache for 30 Minute
                );
            }

            logger.info(`Event published in ${duration.toFixed(2)}ms`, {
                eventId: publishResult.eventId,
                targetsCount: publishResult.targetsCount,
                workspaceId: workspaceId.toString(),
            });

            return c.json(successResponse, 200);
        } catch (error: any) {
            timer.end();
            logger.error('Unexpected error in EventController.publishEvent', error);

            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'An unexpected error occurred',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * Publishes multiple events in a single batch.
     * Optimized target lookups and NATS batching.
     */
    static async publishEvents(c: AppContext): Promise<Response> {
        const timer = new PerformanceTimer('batch_event_creation');
        try {
            const idempotencyKey = c.idempotencyKey;
            const workspaceId = c.workspace?.workspaceId;

            // @ts-ignore
            const param: GetNamespaceByIdInput = c.req.valid('param');
            const namespaceId = unprefixId(param.namespaceId)!;

            // @ts-ignore
            const valid = c.req.valid('json') as BatchPublishedEventInput;

            if (!workspaceId || !namespaceId) {
                const errorResponse: IErrorResponse = {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                        requestId: c.get('requestId'),
                    },
                };

                if (idempotencyKey && workspaceId) {
                    await redisConfig.set(
                        RedisKeys.idempotency.key(
                            workspaceId.toString(),
                            c.req.path,
                            idempotencyKey
                        ),
                        JSON.stringify({ status: 'failed', error: errorResponse.error }),
                        60 * 30 // Cache for 30 Minute
                    );
                }

                return c.json<IErrorResponse>(errorResponse, 401);
            }

            if (!valid || valid.length === 0) {
                const errorResponse: IErrorResponse = {
                    success: false,
                    error: {
                        code: 'INVALID_PAYLOAD',
                        message: 'No events provided in request',
                        requestId: c.get('requestId'),
                    },
                };

                if (idempotencyKey && workspaceId) {
                    await redisConfig.set(
                        RedisKeys.idempotency.key(
                            workspaceId.toString(),
                            c.req.path,
                            idempotencyKey
                        ),
                        JSON.stringify({ status: 'failed', error: errorResponse.error }),
                        60 * 30 // Cache for 30 Minute
                    );
                }

                return c.json<IErrorResponse>(errorResponse, 400);
            }

            if (valid.length > 1000) {
                const errorResponse: IErrorResponse = {
                    success: false,
                    error: {
                        code: 'BATCH_TOO_LARGE',
                        message: 'Maximum 1000 events per batch allowed',
                        requestId: c.get('requestId'),
                    },
                };

                if (idempotencyKey && workspaceId) {
                    await redisConfig.set(
                        RedisKeys.idempotency.key(
                            workspaceId.toString(),
                            c.req.path,
                            idempotencyKey
                        ),
                        JSON.stringify({ status: 'failed', error: errorResponse.error }),
                        60 * 30 // Cache for 30 Minute
                    );
                }

                return c.json<IErrorResponse>(errorResponse, 400);
            }

            const results: any[] = [];
            const events: BatchCreatePublishedEvent = [];

            // Optimized: Unique set of targets for the entire batch
            const targetIdsSet = new Set<string>();
            valid.forEach(eventData => {
                eventData.targets.forEach(t => {
                    if (t.targetId) targetIdsSet.add(t.targetId);
                });
            });

            const { foundTargets } = await EventController.checkTargetsExsisting(
                workspaceId.toString(),
                namespaceId,
                Array.from(targetIdsSet)
            );

            const foundTargetsMap = new Map(foundTargets.map(t => [unprefixId(t.targetId), t]));
            const shard = parseInt(workspaceId.toString().slice(-6), 16) % 10;

            for (let index = 0; index < valid.length; index++) {
                const eventData = valid[index]!;
                const eventId = snowflake.generate();
                const eventFoundTargets: any[] = [];
                const eventUnfoundTargets: string[] = [];

                eventData.targets.forEach(t => {
                    const found = foundTargetsMap.get(unprefixId(t.targetId!));
                    if (found) {
                        eventFoundTargets.push(found);
                    } else {
                        eventUnfoundTargets.push(t.targetId!);
                    }
                });

                if (eventFoundTargets.length === 0) {
                    results.push({
                        eventId,
                        status: 'skipped',
                        targetsCount: 0,
                        unfoundTargets: eventUnfoundTargets,
                        error: 'No valid targets',
                    });
                    continue;
                }

                events.push({
                    ...eventData,
                    eventId,
                    workspaceId: workspaceId.toString(),
                    namespaceId,
                    targets: eventFoundTargets as any,
                    sourceType: 'publish',
                    timestamp: Date.now(),
                    shard,
                } as any);
            }

            // Check limits
            const canProceed = await LimitChecker.checkEventLimit(workspaceId.toString());
            if (!canProceed) {
                const errorResponse: IErrorResponse = {
                    success: false,
                    error: {
                        code: 'LIMIT_EXCEEDED',
                        message: 'Monthly event limit exceeded',
                        requestId: c.get('requestId'),
                    },
                };

                if (idempotencyKey && workspaceId) {
                    await redisConfig.set(
                        RedisKeys.idempotency.key(
                            workspaceId.toString(),
                            c.req.path,
                            idempotencyKey
                        ),
                        JSON.stringify({ status: 'failed', error: errorResponse.error }),
                        60 * 30 // Cache for 30 Minute
                    );
                }

                return c.json<IErrorResponse>(errorResponse, 403);
            }

            const planSlugRaw = await redisConfig.get(
                RedisKeys.billing.workspacePlan(workspaceId.toString())
            );
            const planSlug = planSlugRaw ? JSON.parse(planSlugRaw).planSlug : 'free';

            let queuedCount = 0;
            if (events.length > 0) {
                const natsResults = await publishEventPublisher.batch(events, planSlug);

                natsResults.forEach((nr, idx) => {
                    const event = events[idx];
                    if (!event) return;

                    const eventId = event.eventId;
                    if (nr && nr.success) {
                        queuedCount++;
                        results.push({
                            eventId,
                            status: 'queued',
                            targetsCount: nr.targetsCount,
                        });
                    } else {
                        results.push({
                            eventId,
                            status: 'failed',
                            targetsCount: event.targets.length,
                            error: nr?.error || 'NATS publish failed',
                        });
                    }
                });
            }

            const duration = timer.end();
            if (queuedCount > 0) {
                usageProducer.trackEvent(
                    workspaceId.toString(),
                    undefined,
                    'eventsPerMonth',
                    queuedCount
                );
            }

            const finalResponse = {
                status: queuedCount > 0 ? 'queued' : 'failed',
                batchSize: valid.length,
                queuedCount,
                results,
                queuedAt: new Date().toISOString(),
                processingTimeMs: Math.round(duration),
            };

            if (idempotencyKey && workspaceId) {
                await redisConfig.set(
                    RedisKeys.idempotency.key(workspaceId.toString(), c.req.path, idempotencyKey),
                    JSON.stringify({ status: 'completed', response: finalResponse }),
                    60 * 30 // Cache for 30 Minute
                );
            }

            logger.info(
                `Batch events processed: ${queuedCount} queued in ${duration.toFixed(2)}ms`,
                {
                    workspaceId: workspaceId.toString(),
                    batchSize: valid.length,
                }
            );

            return c.json(finalResponse, 200);
        } catch (error: any) {
            timer.end();
            logger.error('Unexpected error in EventController.publishEvents', error);

            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'An unexpected error occurred',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
}
