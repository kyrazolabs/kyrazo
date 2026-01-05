import { forwardEventPublisher } from "@/producers/jobs/v1/publishers";
import { CreateForwardEvent } from "@/utils/libs/zod";

export class HandleForwardEvent {
  static send = async (
    job: CreateForwardEvent
  ): Promise<{ success: boolean }> => {
    const result = await forwardEventPublisher.forward(job)

    if (!result) {
      throw result;
    }

    return result;
  };

  // Listeners
  static onComplete = async (
    job: CreateForwardEvent,
    result: Promise<{ success: boolean }>
  ) => {
    // If you then you can perform database or any other action
    console.log(`Job ${job.subject} completed with result `, result);
  };

  static onFailed = async (
    job: CreateForwardEvent,
    err: Error
  ) => {
    console.error(`Job ${job.subject} failed: ${err.message}`);
    // Log this msg on Sentry for DLQ or create a DLQ Queue
  };
}
