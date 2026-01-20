import {
  queuesName,
  redisBullmqClient,
} from "@mail/lib/bullMQ/config.bullmq.js";
import type { MailPayloadSchema } from "@mailq/utils/zod";
import { Worker } from "bullmq";
import type z from "zod";
import { HandleMailSend } from "./handle-mail-send.handler.js";
import type { CreateEmailResponseSuccess } from "resend";

const worker = new Worker<
  Omit<z.infer<typeof MailPayloadSchema>, "priority">,
  CreateEmailResponseSuccess
>(
  queuesName.sendMailQueueName,
  async (job) => {
    return await HandleMailSend.send(job.data);
  },
  {
    connection: redisBullmqClient,
    concurrency: 1,
    // Adjust according to your service provider
    // This is also depend on machine hardware
    limiter: {
      max: 2,
      duration: 1000,
    },
    prefix: "mailq",
  }
);

worker.on("completed", async (job, result) => {
  await HandleMailSend.onComplete(job.data, result);
});

worker.on("failed", async (job, err) => {
  if (!job) return;

  const jobData = job.data;

  const maxAttempts = job?.opts?.attempts ?? 1;
  if (job.attemptsMade < maxAttempts) return;

  await HandleMailSend.onFailed(jobData, err);
});
