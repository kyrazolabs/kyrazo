import { DeliveryStatus } from "@kyrazo/shared";
import { BaseProducer } from "./base.producer";
import type { DispatchEventInput } from "./producer.type";

class DispatchProducer extends BaseProducer {
    async record(event: DispatchEventInput): Promise<void> {
        const minute = this.getMinuteBucket(event.timestamp);
        const key = `analytics:rt:${event.projectId}:dispatch:${minute}:${event.targetId}:${event.eventType}:${event.responseCode}`;

        // Idempotency check
        if (event.deliveryId) {
            const dedupKey = `analytics:dedup:${event.deliveryId}:${event.status}`;
            const isNew = await this.redis.set(dedupKey, "1", "EX", 3600, "NX");
            if (!isNew) return;
        }

        const pipeline = this.redis.pipeline();

        // Only increment total for final states or initial pending?
        // To avoid double counting retries (Processing -> Delivered), we only increment total for Delivered/Failed?
        // But we want to see Pending in Total?
        // User wants 1000 for 1000 events.
        // If we exclude PROCESSING from Total:
        // Retry: Processing(0) -> Delivered(1) = 1 Total. Correct.
        if (event.status !== DeliveryStatus.PROCESSING) {
            pipeline.hincrby(key, "total", 1);
        }

        if (event.status === DeliveryStatus.DELIVERED) {
            pipeline.hincrby(key, event.status, 1);
        } else if (
            event.status === DeliveryStatus.FAILED ||
            event.status === DeliveryStatus.NETWORK_ERROR ||
            event.status === DeliveryStatus.TIMEOUT
        ) {
            pipeline.hincrby(key, event.status, 1);
        } else if (
            event.status === DeliveryStatus.PROCESSING ||
            event.status === DeliveryStatus.PENDING
        ) {
            pipeline.hincrby(key, event.status, 1);
        }

        pipeline.hincrby(key, "latency_sum", event.latencyMs);
        pipeline.hincrby(key, "latency_count", 1);

        pipeline.eval(
            `
      local current = redis.call("HGET", KEYS[1], "max_latency")
      if not current or tonumber(ARGV[1]) > tonumber(current) then
        redis.call("HSET", KEYS[1], "max_latency", ARGV[1])
      end
      return 1
      `,
            1,
            key,
            event.latencyMs,
        );

        pipeline.expire(key, 120);

        await pipeline.exec();
    }
}

export const dispatchAnalyticsProducer = new DispatchProducer();
