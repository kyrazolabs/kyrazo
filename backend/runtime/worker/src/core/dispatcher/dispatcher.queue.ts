import { EventEmitter } from 'events';
import { dispatchConsumer } from '@/consumers/queues/dispatch.consumer';
import type { IDispatchedEvent, IWebhookHeaders } from './dispatcher.types';
import { redisConfig } from '@/config';
import { targetRepository } from '@/services/mongo/target.repo';
import { logger, RedisKeys } from '@kyrazo/shared';
import { endpointRepository } from '@/services/mongo/endpoint.repo';

export enum JOB_PRIORITIES {
    LOW = 10,
    NORMAL = 5,
    HIGH = 1,
    CRITICAL = 0,
}
/**
 * Event Dispatcher
 * Handles the actual delivery of events to target URLs
 */
export class DispatcherQueue extends EventEmitter {
    private static instance: DispatcherQueue;

    private constructor() {
        super();
    }

    public static getInstance(): DispatcherQueue {
        if (!DispatcherQueue.instance) {
            DispatcherQueue.instance = new DispatcherQueue();
        }
        return DispatcherQueue.instance;
    }

    /**
     * Dispatch event to all targets using BullMQ queue
     */
    public async enqueue(
        event: IDispatchedEvent,
        headers: IWebhookHeaders,
        targets: any[],
        type: 'target' | 'endpoint' = 'target'
    ): Promise<void> {
        try {
            logger.info(
                `📦 Dispatching event ${event.id} to ${targets.length} targets (argument) and ${event.targets.length} targets (event prop) via queue`
            );

            if (!targets || targets.length === 0) {
                logger.info('No targets provided in event');
                return;
            }

            const configuredTargets = await this.configureTargets(event, type);
            const jobIds = await dispatchConsumer.enqueue(event, configuredTargets, headers);

            logger.info(`✅ Queued ${jobIds.length} dispatch jobs for event ${event.id}`);
        } catch (error: any) {
            logger.error('Error dispatching to targets via queue:', error);
            throw error;
        }
    }

    /**
     * Configure target for dispatch job based on event and target
     */
    private async configureTargets(
        event: IDispatchedEvent,
        type: 'target' | 'endpoint' = 'target'
    ): Promise<
        {
            type: 'target' | 'endpoint';
            targetId: string;
            url: string;
            priority: number;
            rateLimit?: number;
            rateLimitDuration?: number;
            retryCount?: number;
            customHeaders?: Record<string, string>;
            method?: string;
        }[]
    > {
        const targets: {
            type: 'target' | 'endpoint';
            targetId: string;
            url: string;
            priority: number;
            rateLimit?: number;
            rateLimitDuration?: number;
            retryCount?: number;
            customHeaders?: Record<string, string>;
            method?: string;
        }[] = [];
        switch (type) {
            case 'target':
                for await (const tar of event.targets) {
                    if (!tar) {
                        continue;
                    }
                    const targetCacheKey = RedisKeys.context.workspaceNamespaceTarget(event.workspaceId, event.namespaceId, tar.targetId);
                    const cachedTargetRaw = await redisConfig.get(targetCacheKey);
                    let target: any = cachedTargetRaw ? JSON.parse(cachedTargetRaw) : null;

                    if (!target) {
                        target = await targetRepository.getTargetById(
                            tar.targetId,
                            event.workspaceId,
                            event.namespaceId
                        );
                        // Only cache if the target actually exists — never cache null
                        if (target) {
                            await redisConfig.set(targetCacheKey, JSON.stringify(target), 60 * 60 * 10);
                        }
                    }

                    if (!target) {
                        logger.warn(
                            `❌ Target not found in DB or Cache: ${tar.targetId} (Workspace: ${event.workspaceId}, Namespace: ${event.namespaceId})`
                        );
                        continue;
                    }
                    logger.info(`✅ Target found: ${target.id || target._id} (${target.url})`);

                    targets.push({
                        type: 'target',
                        targetId: (target.id || target._id).toString(),
                        url: target.url,
                        priority:
                            event.meta?.priority === 'urgent'
                                ? JOB_PRIORITIES.CRITICAL
                                : event.meta?.priority === 'high'
                                  ? JOB_PRIORITIES.HIGH
                                  : event.meta?.priority === 'normal'
                                    ? JOB_PRIORITIES.NORMAL
                                    : JOB_PRIORITIES.LOW,
                        rateLimit: target.config.rateLimit,
                        rateLimitDuration: target.config.rateLimitDuration,
                        retryCount: target.config.retryCount,
                        customHeaders: target.customHeaders,
                        method: target.method,
                    });
                }
                break;
            case 'endpoint':
                for await (const tar of event.targets) {
                    if (!tar) {
                        continue;
                    }
                    const endpointCacheKey = RedisKeys.context.workspaceNamespaceEndpoint(event.workspaceId, event.namespaceId, tar.targetId);
                    const cachedEndpointRaw = await redisConfig.get(endpointCacheKey);
                    let endpoint: any = cachedEndpointRaw ? JSON.parse(cachedEndpointRaw) : null;

                    if (!endpoint) {
                        endpoint = await endpointRepository.getEndpointById(
                            tar.targetId,
                            event.workspaceId,
                            event.namespaceId
                        );
                        // Only cache if the endpoint actually exists — never cache null
                        if (endpoint) {
                            await redisConfig.set(endpointCacheKey, JSON.stringify(endpoint), 60 * 60 * 10);
                        }
                    }

                    if (!endpoint) {
                        logger.warn(
                            `❌ Endpoint not found in DB or Cache: ${tar.targetId} (Workspace: ${event.workspaceId}, Namespace: ${event.namespaceId})`
                        );
                        continue;
                    }
                    logger.info(
                        `✅ Endpoint found: ${endpoint.id || endpoint._id} (${endpoint.url})`
                    );

                    targets.push({
                        type: 'endpoint',
                        targetId: (endpoint.id || endpoint._id).toString(),
                        url: endpoint.url,
                        priority:
                            event.meta?.priority === 'urgent'
                                ? JOB_PRIORITIES.CRITICAL
                                : event.meta?.priority === 'high'
                                  ? JOB_PRIORITIES.HIGH
                                  : event.meta?.priority === 'normal'
                                    ? JOB_PRIORITIES.NORMAL
                                    : JOB_PRIORITIES.LOW,
                        rateLimit: endpoint.config.rateLimit,
                        rateLimitDuration: endpoint.config.rateLimitDuration,
                        retryCount: endpoint.config.retryCount,
                        customHeaders: endpoint.customHeaders,
                        method: endpoint.method,
                    });
                }
                break;
        }

        return targets;
    }
}

export const dispatcherQueue = DispatcherQueue.getInstance();
