import { BullmqHandler } from "@mailq/bullmq";

const bullmqHandler = new BullmqHandler(
  process.env.REDIS_URL!,
  process.env.NODE_ENV === "production",
);

export const queuesName = bullmqHandler.getQueueNames();
export const queues = bullmqHandler.getQueues();
export const redisBullmqClient = bullmqHandler.redisClient;
