import type { MailPayloadSchema } from "@mailq/utils/zod";
import { describe, it, expect } from "vitest";
import type z from "zod";
import { HandleMailSend } from "./handler.js";
import type { ErrorResponse } from "resend";

describe("HandleMailSend", () => {
  const mockMail: Omit<z.infer<typeof MailPayloadSchema>, "priority"> = {
    to: "user@example.com",
    subject: "Welcome to Our App 🎉",
    html: `
    <div style="font-family: Arial, sans-serif; line-height:1.5">
      <h1>Welcome!</h1>
      <p>Hi there,</p>
      <p>Thank you for signing up. We're excited to have you on board 🚀</p>
      <p>– The Team</p>
    </div>
  `,
  };

  it("should mail send", async () => {
    try {
      const res = await HandleMailSend.send(mockMail);
      expect(res.id).toBeDefined();

      expect(typeof res.id).toBe("string");
    } catch (err) {
      const error = err as ErrorResponse;
      console.error("[Test Error] Error in send mail", error);

      expect(error).toBeDefined();
    }
  });
});
