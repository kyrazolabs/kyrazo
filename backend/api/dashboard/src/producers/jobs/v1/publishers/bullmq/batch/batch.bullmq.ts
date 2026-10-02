import { bullmqConfig } from '@/configs/bullmq';

export const batchQueuesName = bullmqConfig.getQueueNames().BatchC;
export const batchQueues = bullmqConfig.getQueues().BatchQ;
