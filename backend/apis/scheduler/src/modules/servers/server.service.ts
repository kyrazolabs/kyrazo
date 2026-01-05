import { db } from "@/db";
import { servers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

export class ServerService {
  /**
   * Register a new serverNode.
   * Returns the generated API Key.
   */
  static async register(data: { cores: number; max_workers: number }) {
    const apiKey = `sk_srv_${randomBytes(24).toString("hex")}`;

    const [newServer] = await db
      .insert(servers)
      .values({
        api_key: apiKey,
        cores: data.cores,
        max_workers: data.max_workers,
        status: "active",
      })
      .returning();

    return {
      serverId: newServer?.server_id,
      apiKey: newServer?.api_key,
    };
  }

  /**
   * Process Heartbeat.
   * Updates last_heartbeat timestamp.
   * If server was 'down', marks it 'active'.
   */
  static async heartbeat(serverId: string) {
    await db
      .update(servers)
      .set({
        last_heartbeat: new Date(),
        status: "active", // Auto-recover status
      })
      .where(eq(servers.server_id, serverId));

    return { status: "ok" };
  }
}
