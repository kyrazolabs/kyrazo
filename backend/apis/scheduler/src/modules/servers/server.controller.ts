import type { Context } from "hono";
import { ServerService } from "./server.service";
import { db } from "@/db";
import { serverCommands } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { AppError } from "@/common/error";

export class ServerController {
  // Handlers now assume validated data is passed, but Hono validator middleware handles the response.
  // We can just get the json from context safely if validated.
  // But usage pattern with @hono/zod-validator typically wraps the route.
  // Here we keep static methods for the logic, and we'll apply middleware in main.ts or route definition.

  static async register(c: Context) {
    const { cores, max_workers } = await c.req.json(); // Validated by middleware
    const result = await ServerService.register({ cores, max_workers });
    return c.json(result, 201);
  }

  static async heartbeat(c: Context) {
    const server = c.get("server");
    await ServerService.heartbeat(server.server_id);
    return c.json({ status: "ok" });
  }

  static async getCommands(c: Context) {
    const server = c.get("server");

    const commands = await db
      .select()
      .from(serverCommands)
      .where(
        and(
          eq(serverCommands.server_id, server.server_id),
          eq(serverCommands.status, "pending")
        )
      );

    return c.json({ commands });
  }

  static async ackCommand(c: Context) {
    const server = c.get("server");
    const { commandId, status } = await c.req.json(); // Validated by middleware

    const result = await db
      .update(serverCommands)
      .set({ status, acked_at: new Date() })
      .where(
        and(
          eq(serverCommands.command_id, commandId),
          eq(serverCommands.server_id, server.server_id)
        )
      )
      .returning();

    if (result.length === 0) {
      throw new AppError("Command not found or ignored", 404);
    }

    return c.json({ success: true });
  }
}
