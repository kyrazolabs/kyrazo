import { z } from "zod";

export const MailPayloadSchema = z.object({
  to: z.email("Invalid email address").trim(),
  subject: z.string().min(1, "Subject is required").trim(),
  html: z.string().min(1, "HTML content is required").trim(),
  priority: z.enum(["high", "medium", "low"]),
});
