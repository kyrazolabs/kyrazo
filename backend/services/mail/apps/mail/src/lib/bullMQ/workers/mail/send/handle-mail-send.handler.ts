import { resend } from "@mail/lib/resend/config.resend.js";
import type { MailPayloadSchema } from "@mailq/utils/zod";
import type { CreateEmailResponseSuccess } from "resend";
import type z from "zod";

export class HandleMailSend {
  static send = async (
    job: Omit<z.infer<typeof MailPayloadSchema>, "priority">
  ): Promise<CreateEmailResponseSuccess> => {
    const { data, error } = await resend.emails.send({
      from: process.env.SENDER_MAIL!,
      to: [job.to],
      subject: job.subject,
      html: job.html,
    });

    if (error) {
      throw error;
    }

    return data;
  };

  // Listeners
  static onComplete = async (
    job: Omit<z.infer<typeof MailPayloadSchema>, "priority">,
    result: CreateEmailResponseSuccess
  ) => {
    // If you then you can perform database or any other action
    console.log(`Job ${job.subject} completed with result `, result);
  };

  static onFailed = async (
    job: Omit<z.infer<typeof MailPayloadSchema>, "priority">,
    err: Error
  ) => {
    console.error(`Job ${job.subject} failed: ${err.message}`);
    // Log this msg on Sentry for DLQ or create a DLQ Queue
  };
}
