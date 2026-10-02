import { bullmqConfig } from '@/configs/bullmq';

export const storeQueuesName = bullmqConfig.getQueueNames().StoreC;
export const storeQueues = bullmqConfig.getQueues().StoreQ;
