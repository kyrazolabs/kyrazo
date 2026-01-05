import { IReceivedEvent } from "@/types/events/event.types";
import { receivedEventRepository } from "@/database/models/clickhouse/repositories/received.repo";
import { eventDispatcher } from "@/app/event/event.dispatcher";
import { logger } from "@/utils";

/**
 * @title Route Event Processor
 * @description Processes route events by getting targets and dispatching to them
 */
export class RouteProcessor {
    private static instance: RouteProcessor;

    private constructor() {}

    public static getInstance(): RouteProcessor {
        if (!RouteProcessor.instance) {
            RouteProcessor.instance = new RouteProcessor();
        }
        return RouteProcessor.instance;
    }

    /**
     * Process a route event
     */
    public async processEvent(event: any, targets: any[]): Promise<void> {
        try {
            logger.debug(`🔄 Processing route event: ${event.eventId}`);

            // 1. Get the received event from database
            const receivedEvent =
                await receivedEventRepository.getReceivedEvent(event.eventId);

            if (!receivedEvent) {
                throw new Error(`Received event not found: ${event.eventId}`);
            }

            // 2. Validate the event is ready for routing
            if (receivedEvent.processingStatus !== "processed") {
                throw new Error(
                    `Event not ready for routing: ${receivedEvent.processingStatus}`
                );
            }

            // 3. Get targets for this workspace (not based on eventType)
            const routeTargets = await this.getRouteTargets(event.workspaceId);

            // 4. If no targets found, use provided targets or throw error
            let finalTargets = routeTargets;
            if (finalTargets.length === 0) {
                if (targets && targets.length > 0) {
                    finalTargets = targets;
                    logger.debug(
                        `Using provided targets for event: ${event.eventId}`
                    );
                } else {
                    throw new Error(
                        `No targets found for workspace: ${event.workspaceId}`
                    );
                }
            }

            // 5. Transform event for dispatch
            const dispatchEvent = this.transformForDispatch(
                receivedEvent,
                event
            );

            // 6. Dispatch to targets using existing queue system
            await eventDispatcher.dispatchToTargets(
                dispatchEvent,
                event.webhookId,
                finalTargets
            );

            logger.debug(
                `✅ Route event processed: ${event.eventId} -> ${finalTargets.length} targets`
            );
        } catch (error) {
            logger.error(
                `❌ Error processing route event ${event.eventId}:`,
                error
            );
            throw error;
        }
    }

    /**
     * Get route targets from database
     */
    private async getRouteTargets(workspaceId: string): Promise<any[]> {
        try {
            // Query routed_events table for active targets
            const query = `
        SELECT target_url, secret, name, description
        FROM routed_events
        WHERE workspace_id = {workspaceId:String}
        AND is_active = 1
      `;

            const client = await this.getClickHouseClient();
            const result = await client.query({
                query,
                query_params: { workspaceId },
                format: "JSONEachRow",
            });

            const rows = (await result.json()) as any[];

            // Transform to target format expected by dispatcher
            const targets = rows.map((row) => ({
                targetId: `route_${row.name}_${Date.now()}`,
                targetUrl: row.target_url,
                workspaceId: workspaceId,
                webhookId: "", // Will be set by caller
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }));

            logger.debug(
                `Found ${targets.length} route targets for workspace: ${workspaceId}`
            );
            return targets;
        } catch (error) {
            logger.error("Error getting route targets:", error);
            return [];
        }
    }

    /**
     * Transform received event for dispatch
     */
    private transformForDispatch(
        receivedEvent: IReceivedEvent,
        routeEvent: any
    ): any {
        return {
            eventId: receivedEvent.eventId,
            workspaceId: receivedEvent.workspaceId,
            webhookId: receivedEvent.webhookId,
            webhookType: "publish", // Transform to publish for dispatch
            producerId: "route-processor",
            eventType: routeEvent.eventType || "route.default",
            timestamp: Date.now(),
            data: receivedEvent.body,

            // Use route metadata for retry configuration
            meta: {
                priority: routeEvent.routeToMeta?.priority || "normal",
                maxRetries: routeEvent.routeToMeta?.maxRetries || 3,
                insertedAt: routeEvent.routeToMeta?.insertedAt || new Date(),
            },
        };
    }

    /**
     * Get ClickHouse client
     */
    private async getClickHouseClient() {
        const { clickhouseConfig } = await import("@/config/clickhouse.config");
        return clickhouseConfig.getClient();
    }
}

export const routeProcessor = RouteProcessor.getInstance();
