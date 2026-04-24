import { Queue, type QueueOptions } from 'bullmq';
import { RetryC } from '@/producers/constants/constants.bullmq';
import type { CreatePublishedEvent } from '@/core/utils/libs/zod';
import type { IForwardedEvent, IReceivedEvent } from '@kyrazo/shared';

type ForwardRetryPayload = Omit<
    IForwardedEvent,
    'producerId' | 'meta' | 'associatedEventId' | 'processingStatus'
>;
type ReceiveRetryPayload = Omit<IReceivedEvent, 'producerId'>;

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

        receiveQueue: new Queue<ReceiveRetryPayload>(
            RetryC.receiveQueueName,
            optionWithThreeRetries
        ),
    };

    return {
        RetryQ,
    };
};
