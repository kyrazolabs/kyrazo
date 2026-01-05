import { bullmqConfig } from '@/configs/bullmq';

export const mailQueuesName = bullmqConfig.getQueueNames().MailC;
export const mailQueues = bullmqConfig.getQueues().MailQ;
