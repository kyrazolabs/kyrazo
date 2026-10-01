import { Queue, QueueOptions } from "bullmq";
import {
  sendMailHighPriorityQueueName,
  sendMailLowPriorityQueueName,
  sendMailMediumPriorityQueueName,
  sendMailQueueName,
} from "../constants/constants.bullmq.js";
import { z } from "zod";
import type { MailPayloadSchema } from "@mailq/utils/zod";

type MailSendPayload = Omit<z.infer<typeof MailPayloadSchema>, "priority">;

export const bullmqQueues = (options: QueueOptions) => {
  const optionWithThreeRetries = {
    ...options,
    defaultJobOptions: {
      ...options.defaultJobOptions,
      attempts: 3,
    },
  };

  const sendMailHighPriorityQueue = new Queue<MailSendPayload>(
    sendMailHighPriorityQueueName,
    optionWithThreeRetries
  );

  const sendMailMediumPriorityQueue = new Queue<MailSendPayload>(
    sendMailMediumPriorityQueueName,
    optionWithThreeRetries
  );

  const sendMailLowPriorityQueue = new Queue<MailSendPayload>(
    sendMailLowPriorityQueueName,
    optionWithThreeRetries
  );

  const sendMailQueue = new Queue<MailSendPayload>(
    sendMailQueueName,
    optionWithThreeRetries
  );

  return {
    sendMailHighPriorityQueue,
    sendMailMediumPriorityQueue,
    sendMailLowPriorityQueue,
    sendMailQueue,
  };
};
