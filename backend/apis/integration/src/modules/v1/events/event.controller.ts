import type { AppContext } from '@/core/middlewares/auth.middleware';
import { v4 as uuidv4 } from 'uuid';
import { redisConfig } from '@/configs';
import { PerformanceTimer } from '@/core/utils';
import { logger, type IErrorResponse } from '@kyrazo/shared';
import { publishEventPublisher } from '@/producers/jobs/v1/publishers';
import { type GetProjectByIdInput } from '@/core/utils/libs/zod';
import type {
    BatchCreatePublishedEvent,
    BatchPublishedEventInput,
    CreatePublishedEvent,
    PublishedEventInput,
    TargetInput,
} from './event.schema';
import { usageProducer } from '@/core/services/usage.producer';
import { LimitChecker } from '@/core/services/limit.checker';
import { targetRepository } from '@/repositories/target.repo';

export class EventController {
    private static async checkTargetsExsisting(
        workspaceId: string,
        projectId: string,
        targets: string[]
    ): Promise<{
        foundTargets: { targetId: string; targetUrl: string }[];
        unfoundTargets: string[];
    }> {
        // 1. Try to get it from the cash
        let cachedTargets = await redisConfig.cache(
            `workspace:${workspaceId}:project:${projectId}:targets`,
            async () => [],
            100
        );

        // 2. Split: Found in cash / Lost
        const cachedMap = new Map(cachedTargets.map((t: any) => [t._id.toString(), t]));
        const missingFromCache = targets.filter(id => !cachedMap.has(id));

        // 3. Retrieve missing information from the database
        let fetchedTargets: any[] = [];
        if (missingFromCache.length > 0) {
            fetchedTargets = await targetRepository.getTargetsByWorkspaceIdAndProjectIdAndTargetIds(
                workspaceId,
                projectId,
                missingFromCache
            );
        }

        // 4. Merge the cache with the retrieved data from the database and update the cache.
        const allTargets = [
            ...cachedTargets,
            ...fetchedTargets.filter(t => !cachedMap.has(t._id.toString())),
        ];
        if (fetchedTargets.length > 0) {
            await redisConfig.cache(
                `workspace:${workspaceId}:project:${projectId}:targets`,
                async () => allTargets,
                60 * 60 * 24
            );
        }

        const foundTargets = allTargets.map(t => ({
            targetId: t._id.toString(),
            targetUrl: t.url,
        }));

        const foundSet = new Set(foundTargets.map(t => t.targetId));
        const unfoundTargets = targets.filter(id => !foundSet.has(id));

        return { foundTargets, unfoundTargets };
    }

    static async publishEvent(c: AppContext): Promise<Response> {
        const timer = new PerformanceTimer('event_creation');
        try {
            const key = c.idempotencyKey;
            const workspaceId = c.workspace?.workspaceId;
            const { projectId }: GetProjectByIdInput = c.req.valid('param');
            const valid: PublishedEventInput = c.req.valid('json');

            if (!workspaceId || !projectId) {
                await redisConfig.set(
                    `idem:${workspaceId}:${c.req.path}:${key}`,
                    JSON.stringify({
                        status: 'failed',
                        error: {
                            code: 'UNAUTHORIZED',
                            message: 'Authentication required',
                            requestId: c.get('requestId'),
                        },
                    }),
                    60 * 60 * 24
                );
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED',
                            message: 'Authentication required',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }

            const shard = parseInt(workspaceId.toString().slice(-6), 16) % 10;
            const data: CreatePublishedEvent = {
                ...valid,
                eventId: uuidv4(),
                workspaceId: workspaceId.toString(),
                projectId,
                sourceType: 'publish',
                timestamp: Date.now(),
                shard,
            };

            const { foundTargets, unfoundTargets } = await EventController.checkTargetsExsisting(
                workspaceId.toString(),
                projectId,
                valid.targets.map((t: TargetInput) => t.targetId)
            );
            if (foundTargets.length === 0) {
                await redisConfig.set(
                    `idem:${workspaceId}:${c.req.path}:${key}`,
                    JSON.stringify({
                        status: 'failed',
                        error: {
                            code: 'NO_VALID_TARGETS',
                            message: 'No valid targets found for this event',
                            details: {
                                unfoundTargets,
                            },
                            requestId: c.get('requestId'),
                        },
                    }),
                    60 * 60 * 24
                );
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'NO_VALID_TARGETS',
                            message: 'No valid targets found for this event',
                            details: {
                                unfoundTargets,
                            },
                            requestId: c.get('requestId'),
                        },
                    },
                    400
                );
            }

            data.targets = foundTargets;

            // Check limits
            const canProceed = await LimitChecker.checkEventLimit(workspaceId.toString());

            if (!canProceed) {
                await redisConfig.set(
                    `idem:${workspaceId}:${c.req.path}:${key}`,
                    JSON.stringify({
                        status: 'failed',
                        error: {
                            code: 'LIMIT_EXCEEDED',
                            message: 'Monthly event limit exceeded',
                            requestId: c.get('requestId'),
                        },
                    }),
                    60 * 60 * 24
                );
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'LIMIT_EXCEEDED',
                            message: 'Monthly event limit exceeded',
                            requestId: c.get('requestId'),
                        },
                    },
                    403
                );
            }

            const planSlug = await redisConfig.get(`workspace:${workspaceId}`);
            const publishResult = await publishEventPublisher.publish({
                ...data,
                planSlug: planSlug ? JSON.parse(planSlug).planSlug : 'free',
            });

            if (!publishResult) {
                await redisConfig.set(
                    `idem:${workspaceId}:${c.req.path}:${key}`,
                    JSON.stringify({
                        status: 'failed',
                        error: {
                            code: 'PUBLISH_EVENT_FAILED',
                            message: 'Failed to publish event',
                            requestId: c.get('requestId'),
                        },
                    }),
                    60 * 60 * 24
                );
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'PUBLISH_EVENT_FAILED',
                            message: 'Failed to publish event',
                            requestId: c.get('requestId'),
                        },
                    },
                    500
                );
            }

            const duration = timer.end();

            // Track usage asynchronously
            usageProducer.trackEvent(workspaceId.toString(), undefined, 'eventsPerMonth', 1);

            // Log performance metrics
            logger.info(`Source created in ${duration.toFixed(2)}ms`, {
                eventId: publishResult.eventId,
                targetsCount: publishResult.targetsCount,
                durationMs: duration,
            });

            await redisConfig.set(
                `idem:${workspaceId}:${c.req.path}:${key}`,
                JSON.stringify({
                    status: 'completed',
                    response: {
                        status: 'queued',
                        eventId: publishResult.eventId,
                        targetsCount: publishResult.targetsCount,
                        unfoundTargets,
                        queuedAt: new Date().toISOString(),
                        processingTimeMs: Math.round(duration),
                    },
                }),
                60 * 60 * 24
            );
            return c.json(
                {
                    status: 'queued',
                    eventId: publishResult.eventId,
                    targetsCount: publishResult.targetsCount,
                    unfoundTargets,
                    queuedAt: new Date().toISOString(),
                    processingTimeMs: Math.round(duration),
                },
                200
            );
        } catch (error: unknown) {
            timer.end();
            logger.error('Unexpected error in EventController.publishEvent', error as Error);
            await redisConfig.set(
                `idem:${c.req.workspace.workspaceId}:${c.req.path}:${c.idempotencyKey}`,
                JSON.stringify({
                    status: 'failed',
                    response: 'Unexpected error',
                }),
                60 * 60 * 24
            );
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'PUBLISH_EVENT_FAILED',
                        message: 'Failed to publish event',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async publishEvents(c: AppContext): Promise<Response> {
        const timer = new PerformanceTimer('batch_event_creation');
        try {
            const key = c.idempotencyKey;
            const workspaceId = c.workspace?.workspaceId;
            const { projectId }: GetProjectByIdInput = c.req.valid('param');
            const valid: BatchPublishedEventInput = c.req.valid('json');

            if (!workspaceId || !projectId) {
                await redisConfig.set(
                    `idem:${workspaceId}:${c.req.path}:${key}`,
                    JSON.stringify({
                        status: 'failed',
                        error: {
                            code: 'UNAUTHORIZED',
                            message: 'Authentication required',
                            requestId: c.get('requestId'),
                        },
                    }),
                    60 * 60 * 24
                );
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED',
                            message: 'Authentication required',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }

            if (!valid || valid.length === 0) {
                await redisConfig.set(
                    `idem:${workspaceId}:${c.req.path}:${key}`,
                    JSON.stringify({
                        status: 'failed',
                        error: {
                            code: 'INVALID_PAYLOAD',
                            message: 'No events provided in request',
                            requestId: c.get('requestId'),
                        },
                    }),
                    60 * 60 * 24
                );

                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'INVALID_PAYLOAD',
                            message: 'No events provided in request',
                            requestId: c.get('requestId'),
                        },
                    },
                    400
                );
            }

            if (valid.length > 1000) {
                await redisConfig.set(
                    `idem:${workspaceId}:${c.req.path}:${key}`,
                    JSON.stringify({
                        status: 'failed',
                        error: {
                            code: 'BATCH_TOO_LARGE',
                            message: 'Maximum 1000 events per batch allowed',
                            requestId: c.get('requestId'),
                        },
                    }),
                    60 * 60 * 24
                );
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'BATCH_TOO_LARGE',
                            message: 'Maximum 1000 events per batch allowed',
                            requestId: c.get('requestId'),
                        },
                    },
                    400
                );
            }

            const results: {
                eventId: string;
                status: 'queued' | 'skipped' | 'failed';
                targetsCount: number;
                unfoundTargets?: string[];
                error?: string;
            }[] = [];
            const events: BatchCreatePublishedEvent = [];

            // Optimized target lookup for the single projectId
            const allTargetIds = new Set<string>();
            valid.forEach((eventData: PublishedEventInput) => {
                eventData.targets.forEach((t: TargetInput) => allTargetIds.add(t.targetId));
            });

            const { foundTargets, unfoundTargets: globalUnfoundTargets } =
                await EventController.checkTargetsExsisting(
                    workspaceId.toString(),
                    projectId,
                    Array.from(allTargetIds)
                );

            const foundTargetsMap = new Map(foundTargets.map(t => [t.targetId, t]));
            const shard = parseInt(workspaceId.toString().slice(-6), 16) % 10;

            // Process events
            for (let index = 0; index < valid.length; index++) {
                const eventId = uuidv4();
                const eventData = valid[index];

                const eventFoundTargets: {
                    targetId: string;
                    targetUrl: string;
                }[] = [];
                const eventUnfoundTargets: string[] = [];

                eventData.targets.forEach((t: TargetInput) => {
                    const found = foundTargetsMap.get(t.targetId);
                    if (found) {
                        eventFoundTargets.push(found);
                    } else {
                        eventUnfoundTargets.push(t.targetId);
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
                    projectId,
                    targets: eventFoundTargets,
                    sourceType: 'publish',
                    timestamp: Date.now(),
                    shard,
                });
            }

            // Check limits
            const canProceed = await LimitChecker.checkEventLimit(workspaceId.toString());
            if (!canProceed) {
                await redisConfig.set(
                    `idem:${workspaceId}:${c.req.path}:${key}`,
                    JSON.stringify({
                        status: 'failed',
                        error: {
                            code: 'LIMIT_EXCEEDED',
                            message: 'Monthly event limit exceeded',
                            requestId: c.get('requestId'),
                        },
                    }),
                    60 * 60 * 24
                );
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'LIMIT_EXCEEDED',
                            message: 'Monthly event limit exceeded',
                            requestId: c.get('requestId'),
                        },
                    },
                    403
                );
            }

            // Actual publishing
            const planSlug = await redisConfig.get(`workspace:${workspaceId}`);
            let queuedCount = 0;
            if (events.length > 0) {
                const natsResults = await publishEventPublisher.batch(
                    events,
                    planSlug ? JSON.parse(planSlug).planSlug : 'free'
                );

                natsResults.forEach((nr, idx) => {
                    const eventId = events[idx].eventId;
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
                            targetsCount: events[idx].targets.length,
                            error: nr?.error || 'NATS publish failed',
                        });
                    }
                });
            }

            const duration = timer.end();

            // Track usage asynchronously
            if (queuedCount > 0) {
                usageProducer.trackEvent(
                    workspaceId.toString(),
                    undefined,
                    'eventsPerMonth',
                    queuedCount
                );
            }

            // Log performance metrics
            logger.info(
                `Batch processed: ${queuedCount} queued, ${valid.length - queuedCount} skipped/failed in ${duration.toFixed(2)}ms`
            );

            await redisConfig.set(
                `idem:${workspaceId}:${c.req.path}:${key}`,
                JSON.stringify({
                    status: 'completed',
                    response: {
                        status:
                            queuedCount > 0
                                ? 'queued'
                                : results.some(r => r.status === 'failed')
                                  ? 'failed'
                                  : 'skipped',
                        batchSize: valid.length,
                        queuedCount,
                        skippedCount: results.filter(r => r.status === 'skipped').length,
                        failedCount: results.filter(r => r.status === 'failed').length,
                        results,
                        queuedAt: new Date().toISOString(),
                        processingTimeMs: Math.round(duration),
                    },
                }),
                60 * 60 * 24
            );
            return c.json(
                {
                    status:
                        queuedCount > 0
                            ? 'queued'
                            : results.some(r => r.status === 'failed')
                              ? 'failed'
                              : 'skipped',
                    batchSize: valid.length,
                    queuedCount,
                    skippedCount: results.filter(r => r.status === 'skipped').length,
                    failedCount: results.filter(r => r.status === 'failed').length,
                    results,
                    queuedAt: new Date().toISOString(),
                    processingTimeMs: Math.round(duration),
                },
                200
            );
        } catch (error: unknown) {
            timer.end();
            logger.error('Unexpected error in EventController.publishEvents', error as Error);
            await redisConfig.set(
                `idem:${c.req.workspace.workspaceId}:${c.req.path}:${c.idempotencyKey}`,
                JSON.stringify({
                    status: 'failed',
                    response: 'Unexpected error',
                }),
                60 * 60 * 24
            );
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'PUBLISH_EVENT_FAILED',
                        message: 'Failed to publish event',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
}
