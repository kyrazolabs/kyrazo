import { publishEventPublisher } from "@/producers/jobs/v1/publishers";
import { CreatePublishedEvent } from "@/utils/libs/zod";

export class HandlePublishEvent {
  static send = async (
    job: CreatePublishedEvent
  ): Promise<{ success: boolean }> => {
    const result = await publishEventPublisher.publish(job)

    if (!result) {
      throw result;
    }

    return result;
  };

  // Listeners
  static onComplete = async (
    job: CreatePublishedEvent,
    result: Promise<{ success: boolean }>
  ) => {
    // If you then you can perform database or any other action
    console.log(`Job ${job.subject} completed with result `, result);
  };

  static onFailed = async (
    job: CreatePublishedEvent,
    err: Error
  ) => {
    console.error(`Job ${job.subject} failed: ${err.message}`);
    // Log this msg on Sentry for DLQ or create a DLQ Queue
  };
}
