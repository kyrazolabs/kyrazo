import { bullmqConfig } from '@/configs/bullmq';

export const retryQueuesName = bullmqConfig.getQueueNames().RetryC;
export const retryQueues = bullmqConfig.getQueues().RetryQ;
