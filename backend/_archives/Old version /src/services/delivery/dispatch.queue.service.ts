import { EventEmitter } from "events";
import { eventProcessor } from "@/consumers/jobs/event.processor";

/**
 * Dispatch Queue Service - Thin wrapper around Event Processor
 * Provides a simple interface for adding jobs to the queue
 */
export class DispatchQueueService extends EventEmitter {
    private static instance: DispatchQueueService;

    private constructor() {
        super();
        console.log("🚀 Dispatch Queue Service initialized");
    }

    public static getInstance(): DispatchQueueService {
        if (!DispatchQueueService.instance) {
            DispatchQueueService.instance = new DispatchQueueService();
        }
        return DispatchQueueService.instance;
    }

    /**
     * Add event dispatch job to queue with maxRetries from event meta
     */
    public async addToQueue(
        eventId: string,
        webhookId: string,
        targetId: string,
        targetUrl: string,
        event: any, // Full event object to access meta.maxRetries
        headers: Record<string, string> = {},
        priority: number = 5 // Default normal priority
    ): Promise<string> {
        try {
            // Delegate to event processor
            const jobId = await eventProcessor.addToQueue(
                eventId,
                webhookId,
                targetId,
                targetUrl,
                event,
                headers,
                priority
            );

            this.emit("jobAdded", { jobId, eventId, targetUrl });
            return jobId;
        } catch (error) {
            console.error("Error adding job to dispatch queue:", error);
            throw error;
        }
    }

    /**
     * Get queue statistics by delegating to event processor
     */
    public async getQueueStats(): Promise<{
        dispatchQueue: {
            waiting: number;
            active: number;
            completed: number;
            failed: number;
            delayed: number;
        };
        batchQueue: {
            waiting: number;
            active: number;
            completed: number;
            failed: number;
            delayed: number;
        };
    }> {
        return await eventProcessor.getQueueStats();
    }

    /**
     * Get current metrics by delegating to event processor
     */
    public getMetrics(): {
        dispatched: number;
        retried: number;
        failed: number;
        processingTime: number;
    } {
        return eventProcessor.getMetrics();
    }

    /**
     * Gracefully shutdown by delegating to event processor
     */
    public async shutdown(): Promise<void> {
        console.log("🔄 Shutting down dispatch queue service...");
        await eventProcessor.shutdown();
        console.log("✅ Dispatch queue service shutdown complete");
    }

    /**
     * Force process all waiting jobs by delegating to event processor
     */
    public async forceProcessAll(): Promise<void> {
        console.log("🚀 Force processing all waiting jobs...");
        await eventProcessor.forceProcessAll();
    }
}

export const dispatchQueueService = DispatchQueueService.getInstance();
