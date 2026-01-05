import { BullmqHandler } from "@mailq/bullmq";

const bullmqHandler = new BullmqHandler(process.env.REDIS_URL!);

export const queuesName = bullmqHandler.getQueueNames();
export const queues = bullmqHandler.getQueues();
