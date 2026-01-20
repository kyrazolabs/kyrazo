import {
  queues,
  queuesName,
  redisBullmqClient,
} from "@mail/lib/bullMQ/config.bullmq.js";
import type { MailPayloadSchema } from "@mailq/utils/zod";
import { Worker } from "bullmq";
import type z from "zod";

const worker = new Worker<
  Omit<z.infer<typeof MailPayloadSchema>, "priority">,
  void
>(
  queuesName.sendMailMediumPriorityQueueName,
  async (job) => {
    await queues.sendMailQueue.add("send-mail", job.data);
  },
  {
    connection: redisBullmqClient,
    concurrency: 10,
    // If want to Limit
    // limiter: {
    //     max: 10,
    //     duration: 1000,
    // },
    prefix: "mailq",
  }
);

worker.on("failed", (job, err) => {
  if (!job) return;

  const jobData = job.data;

  const maxAttempts = job?.opts?.attempts ?? 1;
  if (job.attemptsMade < maxAttempts) return;

  console.error(`Job ${job.id} failed: ${err.message}`);
  // Log this msg on Sentry for DLQ or create a DLQ Queue
});
