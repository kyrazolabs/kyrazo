import { bullmqConfig } from "@/configs";


export const queuesName = bullmqConfig.getQueueNames().RetryC;
export const queues = bullmqConfig.getQueues().RetryQ;
export const redisBullmqClient = bullmqConfig.redisClient;
