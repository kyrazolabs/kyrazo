import { EventEmitter } from 'events';
import { dispatchProducer } from '@/consumers/queues/dispatch.producer';
import type { IDispatchedEvent, IWebhookHeaders } from './dispatcher.types';
import { redisConfig } from '@/config';
import { targetRepository } from '@/services/mongo/target.repo';
import { logger, RedisKeys } from '@kyrazo/shared';
import { endpointRepository } from '@/services/mongo/endpoint.repo';
import { s3BucketRepository } from '@/services/mongo/s3bucket.repo';
import { asqsRepository } from '@/services/mongo/asqs.repo';
import { transformRepository } from '@/services/mongo/transform.repo';
import { Source, Namespace, unprefixId } from '@kyrazo/shared';

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
        type: 'target' | 'endpoint' | 's3Bucket' | 'asqs' = 'target'
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
            const jobIds = await dispatchProducer.enqueue(event, configuredTargets, headers);

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
        type: 'target' | 'endpoint' | 's3Bucket' | 'asqs' = 'target'
    ): Promise<
        {
            type: 'target' | 'endpoint' | 's3Bucket' | 'asqs';
            targetId: string;
            url: string;
            rateLimit?: number;
            rateLimitDuration?: number;
            retryCount?: number;
            customHeaders?: Record<string, string>;
            method?: string;
            transform?: { id: string; code: string };
        }[]
    > {
        const targets: {
            type: 'target' | 'endpoint' | 's3Bucket' | 'asqs';
            targetId: string;
            url: string;
            rateLimit?: number;
            rateLimitDuration?: number;
            retryCount?: number;
            customHeaders?: Record<string, string>;
            method?: string;
            transform?: { id: string; code: string };
        }[] = [];

        // 🔍 Fetch Source for hierarchy fallback if applicable
        let sourceTransform: { id: string; code: string } | undefined;
        if (event.sourceId) {
            const sourceCacheKey = RedisKeys.context.source(event.sourceId);
            const cachedSourceRaw = await redisConfig.get(sourceCacheKey);
            let source: any = cachedSourceRaw ? JSON.parse(cachedSourceRaw) : null;

            if (!source) {
                source = await Source.findById(unprefixId(event.sourceId));
                if (source) {
                    await redisConfig.set(sourceCacheKey, JSON.stringify(source), 3600);
                }
            }

            if (source?.transformer) {
                const tr = await this.resolveTransform(source.transformer.toString());
                if (tr) {
                    sourceTransform = tr;
                }
            }
        }

        // 🔍 Fetch Namespace for hierarchy fallback
        let namespaceTransform: { id: string; code: string } | undefined;
        const namespaceCacheKey = RedisKeys.context.workspaceNamespace(event.workspaceId, event.namespaceId);
        const cachedNamespaceRaw = await redisConfig.get(namespaceCacheKey);
        let namespace: any = cachedNamespaceRaw ? JSON.parse(cachedNamespaceRaw) : null;

        if (!namespace) {
            namespace = await Namespace.findOne({
                _id: unprefixId(event.namespaceId),
                workspaceId: unprefixId(event.workspaceId),
            }).lean();
            if (namespace) {
                await redisConfig.set(namespaceCacheKey, JSON.stringify(namespace), 3600);
            }
        }

        if (namespace?.transformer) {
            const tr = await this.resolveTransform(namespace.transformer.toString());
            if (tr) {
                namespaceTransform = tr;
            }
        }

        const globalFallback = sourceTransform ?? namespaceTransform;

        switch (type) {
            case 'target':
                for await (const tar of event.targets) {
                    if (!tar) {
                        continue;
                    }
                    const targetCacheKey = RedisKeys.context.workspaceNamespaceTarget(
                        event.workspaceId,
                        event.namespaceId,
                        tar.targetId
                    );
                    const cachedTargetRaw = await redisConfig.get(targetCacheKey);
                    let target: any = cachedTargetRaw ? JSON.parse(cachedTargetRaw) : null;

                    if (!target) {
                        logger.info(
                            `🔍 Cache miss for target ${tar.targetId}, querying MongoDB...`
                        );
                        target = await targetRepository.getTargetById(
                            tar.targetId,
                            event.workspaceId,
                            event.namespaceId
                        );
                        logger.info(
                            `🔍 MongoDB result for target ${tar.targetId}: ${target ? 'FOUND' : 'NULL'}`
                        );
                        // Only cache if the target actually exists — never cache null
                        if (target) {
                            await redisConfig.set(
                                targetCacheKey,
                                JSON.stringify(target),
                                60 * 60 * 10
                            );
                        }
                    }

                    if (!target) {
                        logger.warn(
                            `❌ Target not found in DB or Cache (no fallback URL): ${tar.targetId} (Workspace: ${event.workspaceId}, Namespace: ${event.namespaceId})`
                        );
                        throw Error;
                    }
                    logger.info(`✅ Target found: ${target.id || target._id} (${target.url})`);

                    targets.push({
                        type: 'target',
                        targetId: (target.id || target._id).toString(),
                        url: target.url,
                        rateLimit: target.config?.rateLimit,
                        rateLimitDuration: target.config?.rateLimitDuration,
                        retryCount: target.config?.retryCount ?? 3,
                        customHeaders: target.customHeaders,
                        method: target.method,
                        // Hierarchy: Target > Namespace (Source transformer is skipped for dispatch targets)
                        transform: target.transformer 
                            ? await this.resolveTransform(target.transformer.toString()) 
                            : namespaceTransform,
                    });
                }
                break;
            case 'endpoint':
                for await (const tar of event.targets) {
                    if (!tar) {
                        continue;
                    }
                    const endpointCacheKey = RedisKeys.context.workspaceNamespaceEndpoint(
                        event.workspaceId,
                        event.namespaceId,
                        tar.targetId
                    );
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
                            await redisConfig.set(
                                endpointCacheKey,
                                JSON.stringify(endpoint),
                                60 * 60 * 10
                            );
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
                        rateLimit: endpoint.config.rateLimit,
                        rateLimitDuration: endpoint.config.rateLimitDuration,
                        retryCount: endpoint.config.retryCount,
                        customHeaders: endpoint.customHeaders,
                        method: endpoint.method,
                        transform: endpoint.transformer ? await this.resolveTransform(endpoint.transformer.toString()) : globalFallback,
                    });
                }
                break;
            case 's3Bucket':
                for await (const tar of event.targets) {
                    if (!tar) continue;
                    const cacheKey = RedisKeys.context.s3Bucket(tar.targetId);
                    const cachedRaw = await redisConfig.get(cacheKey);
                    let s3Bucket: any = cachedRaw ? JSON.parse(cachedRaw) : null;

                    if (!s3Bucket) {
                        s3Bucket = await s3BucketRepository.getS3BucketById(
                            tar.targetId,
                            event.workspaceId,
                            event.namespaceId
                        );
                        if (s3Bucket) {
                            await redisConfig.set(cacheKey, JSON.stringify(s3Bucket), 60 * 60);
                        }
                    }

                    if (!s3Bucket) {
                        logger.warn(`❌ S3 Bucket not found: ${tar.targetId}`);
                        continue;
                    }

                    targets.push({
                        type: 's3Bucket',
                        targetId: (s3Bucket.id || s3Bucket._id).toString(),
                        url: `s3://${s3Bucket.bucketName}`, // Virtual URL for identification
                        retryCount: 3,
                        transform: s3Bucket.transformer ? await this.resolveTransform(s3Bucket.transformer.toString()) : globalFallback,
                    });
                }
                break;
            case 'asqs':
                for await (const tar of event.targets) {
                    if (!tar) continue;
                    const cacheKey = RedisKeys.context.asqs(tar.targetId);
                    const cachedRaw = await redisConfig.get(cacheKey);
                    let asqs: any = cachedRaw ? JSON.parse(cachedRaw) : null;

                    if (!asqs) {
                        asqs = await asqsRepository.getASQSById(
                            tar.targetId,
                            event.workspaceId,
                            event.namespaceId
                        );
                        if (asqs) {
                            await redisConfig.set(cacheKey, JSON.stringify(asqs), 60 * 60);
                        }
                    }

                    if (!asqs) {
                        logger.warn(`❌ ASQS not found: ${tar.targetId}`);
                        continue;
                    }

                    targets.push({
                        type: 'asqs',
                        targetId: (asqs.id || asqs._id).toString(),
                        url: asqs.queueUrl,
                        retryCount: 3,
                        transform: asqs.transformer ? await this.resolveTransform(asqs.transformer.toString()) : globalFallback,
                    });
                }
                break;
        }

        return targets;
    }

    /**
     * Helper to resolve transformer ID/Code from cache/DB
     */
    private async resolveTransform(id: string): Promise<{ id: string; code: string } | undefined> {
        const tr = await transformRepository.getTransformerById(id);
        return tr ? { id: tr.id, code: tr.code } : undefined;
    }
}

export const dispatcherQueue = DispatcherQueue.getInstance();
