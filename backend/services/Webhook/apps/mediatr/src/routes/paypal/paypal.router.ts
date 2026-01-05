import { zValidator } from "@hono/zod-validator";
import { MailPayloadSchema } from "@mailq/utils/zod";
import { queues } from "@mediatr/bullMQ/config.bullmq.js";
import { Hono } from "hono";

const mailRouter = new Hono();

mailRouter.post("/send", zValidator("json", MailPayloadSchema), async (c) => {
  const body = c.req.valid("json");

  const { priority, ...bodyWithoutPriority } = body;

  if (priority === "high") {
    await queues.sendMailHighPriorityQueue.add(
      "high-priority-mail",
      bodyWithoutPriority
    );
  }

  if (priority === "medium") {
    await queues.sendMailMediumPriorityQueue.add(
      "medium-priority-mail",
      bodyWithoutPriority
    );
  }

  if (priority === "low") {
    await queues.sendMailLowPriorityQueue.add(
      "low-priority-mail",
      bodyWithoutPriority
    );
  }

  return c.json({ message: "Mail Queued" });
});

export default mailRouter;
