import {
  queuesName,
  redisBullmqClient,
} from "@/consumers/v1/config.bullmq";
import { Worker } from "bullmq";
import { CreatePublishedEvent } from "@/utils/libs/zod";
import { HandlePublishEvent } from "./handle.js";

const worker = new Worker<
  CreatePublishedEvent,
  Promise<{ success: boolean }>
>(
  queuesName.forwardQueueName,
  async (job) => {
    return await HandlePublishEvent.send(job.data);
  },
  {
    connection: redisBullmqClient,
    concurrency: 1,
    // Adjust according to your service provider
    // This is also depend on machine hardware
    limiter: {
      max: 100,
      duration: 1000,
    },
    prefix: "publish",
  }
);

worker.on("completed", async (job, result) => {
  await HandlePublishEvent.onComplete(job.data, result);
});

worker.on("failed", async (job, err) => {
  if (!job) return;

  const jobData = job.data;

  const maxAttempts = job?.opts?.attempts ?? 1;
  if (job.attemptsMade < maxAttempts) return;

  await HandlePublishEvent.onFailed(jobData, err);
});
