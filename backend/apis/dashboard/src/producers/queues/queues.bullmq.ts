import { Queue, QueueOptions } from 'bullmq';
import {
    BatchC,
    MailC,
    RetryC,
    StoreC,
} from '@/producers/constants/constants.bullmq';
import { z } from 'zod';
import type {
    CreatePublishedEvent,
    MailPayloadSchema,
} from '@/core/utils/libs/zod';

type ForwardBatchPayload = CreatePublishedEvent;
type PublishBatchPayload = CreatePublishedEvent;
type ReceiveBatchPayload = CreatePublishedEvent;

type ForwardRetryPayload = CreatePublishedEvent;
type PublishRetryPayload = CreatePublishedEvent;
type ReceiveRetryPayload = CreatePublishedEvent;

type MailSendPayload = Omit<z.infer<typeof MailPayloadSchema>, 'priority'>;

export const bullmqQueues = (options: QueueOptions) => {
    const optionWithThreeRetries = {
        ...options,
        defaultJobOptions: {
            ...options.defaultJobOptions,
            attempts: 3,
        },
    };

    const BatchQ = {
        insertForwardEventsQueue: new Queue<ForwardBatchPayload>(
            BatchC.forwardQueueName,
            optionWithThreeRetries
        ),

        insertPublishEventsQueue: new Queue<PublishBatchPayload>(
            BatchC.publishQueueName,
            optionWithThreeRetries
        ),

        insertReceiveEventsQueue: new Queue<ReceiveBatchPayload>(
            BatchC.receiveQueueName,
            optionWithThreeRetries
        ),
    };

    const MailQ = {
        sendMailHighPriorityQueue: new Queue<MailSendPayload>(
            MailC.sendMailHighPriorityQueueName,
            optionWithThreeRetries
        ),

        sendMailMediumPriorityQueue: new Queue<MailSendPayload>(
            MailC.sendMailMediumPriorityQueueName,
            optionWithThreeRetries
        ),

        sendMailLowPriorityQueue: new Queue<MailSendPayload>(
            MailC.sendMailLowPriorityQueueName,
            optionWithThreeRetries
        ),

        sendMailQueue: new Queue<MailSendPayload>(
            MailC.sendMailQueueName,
            optionWithThreeRetries
        ),
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
    };

    const StoreQ = {
        storeBatchForwardEventsQueue: new Queue<MailSendPayload>(
            StoreC.forwardQueueName,
            optionWithThreeRetries
        ),

        storeBatchPublishEventsQueue: new Queue<MailSendPayload>(
            StoreC.publishQueueName,
            optionWithThreeRetries
        ),

        storeBatchReceiveEventsQueue: new Queue<MailSendPayload>(
            StoreC.receiveQueueName,
            optionWithThreeRetries
        ),
    };

    return {
        BatchQ,
        MailQ,
        RetryQ,
        StoreQ,
    };
};
