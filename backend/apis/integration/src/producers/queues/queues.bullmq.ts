import { Queue, type QueueOptions } from 'bullmq';
import {
    batchPublishQueueName,
    retryPublishQueueName,
    storePublishQueueName,
} from '@/producers/constants/constants.bullmq';
import type { CreatePublishedEvent } from '@/modules/v1/events/event.schema';

type PublishBatchPayload = CreatePublishedEvent;
type PublishRetryPayload = CreatePublishedEvent;
type PublishStorePayload = CreatePublishedEvent;

export const bullmqQueues = (options: QueueOptions) => {
    const optionWithThreeRetries = {
        ...options,
        defaultJobOptions: {
            ...options.defaultJobOptions,
            attempts: 3,
        },
    };

    const insertPublishEventsQueue = new Queue<PublishBatchPayload>(
        batchPublishQueueName,
        optionWithThreeRetries
    );
    const publishQueue = new Queue<PublishRetryPayload>(
        retryPublishQueueName,
        optionWithThreeRetries
    );
    const storeBatchPublishEventsQueue = new Queue<PublishStorePayload>(
        storePublishQueueName,
        optionWithThreeRetries
    );

    return {
        insertPublishEventsQueue,
        publishQueue,
        storeBatchPublishEventsQueue,
    };
};
