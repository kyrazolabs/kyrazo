import { Queue, QueueOptions } from 'bullmq';
import { RetryC } from '@/producers/constants/constants.bullmq';
import type { CreateForwardEvent, CreatePublishedEvent, CreateReceiveEvent } from '@/utils/libs/zod';

// type ForwardBatchPayload = CreatePublishedEvent;
// type PublishBatchPayload = CreatePublishedEvent;
// type ReceiveBatchPayload = CreatePublishedEvent;

type ForwardRetryPayload = CreateForwardEvent;
type PublishRetryPayload = CreatePublishedEvent;
type ReceiveRetryPayload = CreateReceiveEvent;



export const bullmqQueues = (options: QueueOptions) => {
    const optionWithThreeRetries = {
        ...options,
        defaultJobOptions: {
            ...options.defaultJobOptions,
            attempts: 3,
        },
    };

    const RetryQ = {
        forwardQueue: new Queue<ForwardRetryPayload>(
            RetryC.forwardQueueName,
            optionWithThreeRetries
        ),

        publishQueue: new Queue<PublishRetryPayload>(
            RetryC.publishQueueName,
            optionWithThreeRetries
        ),

        receiveQueue: new Queue<ReceiveRetryPayload>(
            RetryC.receiveQueueName,
            optionWithThreeRetries
        ),
    }

    return {
        RetryQ,
    };
};
