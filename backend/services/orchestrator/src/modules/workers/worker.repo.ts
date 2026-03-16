import { db } from '@/db';
import { clients, servers, workers } from '@/db/schema';
import { and, eq, inArray, sql, lt } from 'drizzle-orm';

export class WorkerRepo {
    /**
     * Find the best available server (least loaded) that has capacity.
     * Non-locking read — suitable for informational queries.
     */
    static async findAvailableServer(tx = db) {
        const [bestServer] = await tx
            .select()
            .from(servers)
            .where(
                and(
                    eq(servers.status, 'active'),
                    sql`${servers.active_workers} < ${servers.max_workers}`
                )
            )
            .orderBy(servers.active_workers)
            .limit(1);
        return bestServer;
    }

    /**
     * Find the best available server WITH a row-level lock (FOR UPDATE).
     * Prevents two concurrent transactions from claiming the same last slot.
     */
    static async findAvailableServerForUpdate(tx: any) {
        const result = await tx.execute(
            sql`SELECT * FROM ${servers}
                WHERE ${servers.status} = 'active'
                  AND ${servers.active_workers} < ${servers.max_workers}
                ORDER BY ${servers.active_workers} ASC
                LIMIT 1
                FOR UPDATE`
        );
        return result[0] as typeof servers.$inferSelect | undefined;
    }

    static async getClientForUpdate(tx: any, clientId: string) {
        const result = await tx.execute(
            sql`SELECT * FROM ${clients} WHERE ${clients.client_id} = ${clientId} FOR UPDATE`
        );
        return result[0] as typeof clients.$inferSelect;
    }

    static async upsertClient(tx: any, clientId: string, maxWorkers: number) {
        await tx
            .insert(clients)
            .values({
                client_id: clientId,
                plan_max_workers: maxWorkers,
            })
            .onConflictDoUpdate({
                target: clients.client_id,
                set: {
                    plan_max_workers: maxWorkers,
                },
            });
    }

    /**
     * Atomically increment capacity counters for a client and server.
     * Uses SQL expressions so the UPDATE is safe under concurrency.
     */
    static async lockCapacity(tx: any, clientId: string, serverId: string) {
        await tx
            .update(clients)
            .set({ used_workers: sql`${clients.used_workers} + 1` })
            .where(eq(clients.client_id, clientId));

        await tx
            .update(servers)
            .set({ active_workers: sql`${servers.active_workers} + 1` })
            .where(eq(servers.server_id, serverId));
    }

    static async createPendingWorker(tx: any, clientId: string, serverId: string) {
        const [newWorker] = await tx
            .insert(workers)
            .values({
                client_id: clientId,
                server_id: serverId,
                status: 'pending',
            })
            .returning();
        return newWorker;
    }

    static async getWorker(tx: any, workerId: string) {
        const [worker] = await tx.select().from(workers).where(eq(workers.worker_id, workerId));
        return worker;
    }

    static async setWorkerStopping(tx: any, workerId: string) {
        await tx.update(workers).set({ status: 'stopping' }).where(eq(workers.worker_id, workerId));
    }

    static async updateWorkerStatus(tx: any, workerId: string, status: string) {
        await tx
            .update(workers)
            .set({ status: status as any, updated_at: new Date() })
            .where(eq(workers.worker_id, workerId));
    }

    /**
     * Release resources with a floor of 0 to prevent negative counter drift.
     */
    static async releaseResources(tx: any, clientId: string, serverId: string) {
        await tx.execute(
            sql`UPDATE ${clients} SET used_workers = GREATEST(0, used_workers - 1) WHERE ${clients.client_id} = ${clientId}`
        );
        await tx.execute(
            sql`UPDATE ${servers} SET active_workers = GREATEST(0, active_workers - 1) WHERE ${servers.server_id} = ${serverId}`
        );
    }

    /**
     * Find stale terminated workers (stopped/failed for longer than the given TTL).
     * Returns their IDs, server IDs, and client IDs for Coolify cleanup.
     */
    static async findStaleTerminatedWorkers(ttlMs: number = 60 * 60 * 1000) {
        const cutoff = new Date(Date.now() - ttlMs);
        return await db
            .select({
                worker_id: workers.worker_id,
                server_id: workers.server_id,
                client_id: workers.client_id,
                status: workers.status,
            })
            .from(workers)
            .where(
                and(
                    inArray(workers.status, ['stopped', 'failed']),
                    lt(workers.updated_at, cutoff)
                )
            );
    }

    /**
     * Delete a worker record from the DB. Should be called AFTER Coolify cleanup.
     */
    static async deleteWorker(tx: any, workerId: string) {
        await tx.delete(workers).where(eq(workers.worker_id, workerId));
    }

    /**
     * Reconcile server active_workers count from actual worker records.
     * Counts only non-terminal workers (pending, starting, running, stopping).
     */
    static async reconcileServerCounts() {
        await db.execute(sql`
            UPDATE ${servers} s
            SET active_workers = (
                SELECT COUNT(*)
                FROM ${workers} w
                WHERE w.server_id = s.server_id
                AND w.status IN ('pending', 'starting', 'running', 'stopping')
            )
        `);
    }

    /**
     * Reconcile client used_workers count from actual worker records.
     * Counts only non-terminal workers (pending, starting, running, stopping).
     */
    static async reconcileClientCounts() {
        await db.execute(sql`
            UPDATE ${clients} c
            SET used_workers = (
                SELECT COUNT(*)
                FROM ${workers} w
                WHERE w.client_id = c.client_id
                AND w.status IN ('pending', 'starting', 'running', 'stopping')
            )
        `);
    }
}
