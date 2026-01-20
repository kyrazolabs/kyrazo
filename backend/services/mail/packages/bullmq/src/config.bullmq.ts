import { Redis } from "ioredis";
import type { QueueOptions } from "bullmq";
import * as queuesName from "./constants/constants.bullmq.js";
import * as queues from "./queues/queues.bullmq.js";

export class BullmqHandler {
  private redisUrl: string;
  private bullmqOptions: QueueOptions;
  public redisClient: Redis;

  constructor(redisUrl: string) {
    this.redisUrl = redisUrl;
    this.redisClient = new Redis(this.redisUrl, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: true,
      reconnectOnError: (err) => {
        const targetError = "READONLY";
        const isRecoverable = err.message.includes(targetError);
        if (isRecoverable) {
          console.warn("[Redis BullMQ] Reconnecting due to READONLY error.");
        }
        return isRecoverable;
      },
    });
    this.redisClient.on("connect", () => {
      console.info("[Redis BullMQ] Connection established");
    });

    this.redisClient.on("ready", () => {
      console.info("[Redis BullMQ] Client ready to use");
    });

    this.redisClient.on("error", (err) => {
      console.error("[Redis BullMQ] Redis error:", err);
    });

    this.redisClient.on("reconnecting", () => {
      console.info("[Redis BullMQ] Attempting to reconnect...");
    });

    this.redisClient.on("end", () => {
      console.info("[Redis BullMQ] Connection closed");
    });
    this.bullmqOptions = {
      connection: this.redisClient,
      prefix: "mailq",
      defaultJobOptions: {
        attempts: 10, // 10 retry
        backoff: {
          type: "exponential",
          delay: 5000, // retry after 5s, 10s, 20s
        },
        removeOnComplete: true,
        removeOnFail: false, // Keep failed jobs to be handled later
      },
    };
  }

  public getQueueNames() {
    return queuesName;
  }
  public getQueues() {
    return queues.bullmqQueues(this.bullmqOptions);
  }
}
