import { bullmqConfig } from '@/configs/bullmq';

export const publishQueuesName = bullmqConfig.getQueueNames();
export const publishQueues = bullmqConfig.getQueues();
