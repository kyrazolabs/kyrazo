import { EventEmitter } from "events";
import { dispatchConsumer } from "@/consumers/queues/dispatch.consumer";
import type { IDispatchedEvent, IWebhookHeaders } from "./dispatcher.types";
import { redisConfig } from "@/config";
import { targetRepository } from "@/services/mongo/target.repo";
import { logger } from "@kyrazo/shared";
import { endpointRepository } from "@/services/mongo/endpoint.repo";

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
        type: "target" | "endpoint" = "target",
    ): Promise<void> {
        try {
            logger.info(
                `📦 Dispatching event ${event.id} to ${targets.length} targets (argument) and ${event.targets.length} targets (event prop) via queue`,
            );

            if (!targets || targets.length === 0) {
                logger.info("No targets provided in event");
                return;
            }

            const configuredTargets = await this.configureTargets(event, type);
            const jobIds = await dispatchConsumer.enqueue(
                event,
                configuredTargets,
                headers,
            );

            logger.info(
                `✅ Queued ${jobIds.length} dispatch jobs for event ${event.id}`,
            );
        } catch (error: any) {
            logger.error(
                "Error dispatching to targets via queue:",
                error as Error,
            );
            throw error;
        }
    }

    /**
     * Configure target for dispatch job based on event and target
     */
    private async configureTargets(
        event: IDispatchedEvent,
        type: "target" | "endpoint" = "target",
    ): Promise<
        {
            type: "target" | "endpoint";
            targetId: string;
            url: string;
            priority: number;
            rateLimit?: number;
            rateLimitDuration?: number;
            retryCount?: number;
        }[]
    > {
        const targets: {
            type: "target" | "endpoint";
            targetId: string;
            url: string;
            priority: number;
            rateLimit?: number;
            rateLimitDuration?: number;
            retryCount?: number;
        }[] = [];
        switch (type) {
            case "target":
                for await (const tar of event.targets) {
                    if (!tar) {
                        continue;
                    }
                    const target = await redisConfig.cache(
                        `workspace:${event.workspaceId}:project:${event.projectId}:targets:${tar.targetId}`,
                        async () => {
                            const target = await targetRepository.getTargetById(
                                tar.targetId,
                                event.workspaceId,
                                event.projectId,
                            );
                            return target;
                        },
                    );
                    if (!target) {
                        logger.warn(
                            `❌ Target not found in DB or Cache: ${tar.targetId} (Workspace: ${event.workspaceId}, Project: ${event.projectId})`,
                        );
                        continue;
                    }
                    logger.info(
                        `✅ Target found: ${target._id} (${target.url})`,
                    );

                    targets.push({
                        type: "target",
                        targetId: target._id.toString(),
                        url: target.url,
                        priority:
                            event.meta?.priority === "urgent"
                                ? JOB_PRIORITIES.CRITICAL
                                : event.meta?.priority === "high"
                                  ? JOB_PRIORITIES.HIGH
                                  : event.meta?.priority === "normal"
                                    ? JOB_PRIORITIES.NORMAL
                                    : JOB_PRIORITIES.LOW,
                        rateLimit: target.config.rateLimit,
                        rateLimitDuration: target.config.rateLimitDuration,
                        retryCount: target.config.retryCount,
                    });
                }
                break;
            case "endpoint":
                for await (const tar of event.targets) {
                    if (!tar) {
                        continue;
                    }
                    const endpoint = await redisConfig.cache(
                        `workspace:${event.workspaceId}:project:${event.projectId}:endpoint:${tar.targetId}`,
                        async () => {
                            const target =
                                await endpointRepository.getEndpointById(
                                    tar.targetId,
                                    event.workspaceId,
                                    event.projectId,
                                );
                            return target;
                        },
                    );
                    if (!endpoint) {
                        logger.warn(
                            `❌ Endpoint not found in DB or Cache: ${tar.targetId} (Workspace: ${event.workspaceId}, Project: ${event.projectId})`,
                        );
                        continue;
                    }
                    logger.info(
                        `✅ Endpoint found: ${endpoint._id} (${endpoint.url})`,
                    );

                    targets.push({
                        type: "endpoint",
                        targetId: endpoint._id.toString(),
                        url: endpoint.url,
                        priority:
                            event.meta?.priority === "urgent"
                                ? JOB_PRIORITIES.CRITICAL
                                : event.meta?.priority === "high"
                                  ? JOB_PRIORITIES.HIGH
                                  : event.meta?.priority === "normal"
                                    ? JOB_PRIORITIES.NORMAL
                                    : JOB_PRIORITIES.LOW,
                        rateLimit: endpoint.config.rateLimit,
                        rateLimitDuration: endpoint.config.rateLimitDuration,
                        retryCount: endpoint.config.retryCount,
                    });
                }
                break;
        }

        return targets;
    }
}

export const dispatcherQueue = DispatcherQueue.getInstance();
