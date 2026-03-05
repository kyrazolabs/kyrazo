import { transporter } from "@mail/lib/nodemailer/config.nodemailer.js";
import type { MailPayloadSchema } from "@mailq/utils/zod";
import type z from "zod";
import type nodemailer from "nodemailer";

export class HandleMailSend {
  static send = async (
    job: Omit<z.infer<typeof MailPayloadSchema>, "priority">,
  ): Promise<nodemailer.SentMessageInfo> => {
    console.log("Processing mail job:", JSON.stringify(job, null, 2));
    const info = await transporter.sendMail({
      from: process.env.SENDER_MAIL!,
      to: job.to,
      subject: job.subject,
      html: job.html,
    });

    return info;
  };

  // Listeners
  static onComplete = async (
    job: Omit<z.infer<typeof MailPayloadSchema>, "priority">,
    result: nodemailer.SentMessageInfo,
  ) => {
    // If you then you can perform database or any other action
    console.log(`Job ${job.subject} completed with result `, result);
  };

  static onFailed = async (
    job: Omit<z.infer<typeof MailPayloadSchema>, "priority">,
    err: Error,
  ) => {
    console.error(`Job ${job.subject} failed: ${err.message}`);
    // Log this msg on Sentry for DLQ or create a DLQ Queue
  };
}
