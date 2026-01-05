import { receiveEventPublisher } from "@/producers/jobs/v1/publishers";
import { CreateReceiveEvent } from "@/utils/libs/zod";

export class HandleReceiveEvent {
  static send = async (
    job: CreateReceiveEvent
  ): Promise<{ success: boolean }> => {
    const result = await receiveEventPublisher.receive(job)

    if (!result) {
      throw result;
    }

    return result;
  };

  // Listeners
  static onComplete = async (
    job: CreateReceiveEvent,
    result: Promise<{ success: boolean }>
  ) => {
    // If you then you can perform database or any other action
    console.log(`Job ${job.subject} completed with result `, result);
  };

  static onFailed = async (
    job: CreateReceiveEvent,
    err: Error
  ) => {
    console.error(`Job ${job.subject} failed: ${err.message}`);
    // Log this msg on Sentry for DLQ or create a DLQ Queue
  };
}
