import { db } from '@/db';
import { servers, workers, serverCommands } from '@/db/schema';
import { eq, and, lte, inArray, sql } from 'drizzle-orm';
// import { WorkerScheduler } from '@/modules/workers/worker.scheduler';

/**
 * Monitor Job
 * Runs every X seconds.
 */
export async function monitorDeadServers() {
    console.log('🔍 Running Dead Server Monitor...');

    const THRESHOLD_SECONDS = 30;
    const deadThreshold = new Date(Date.now() - THRESHOLD_SECONDS * 1000);

    // 1. Find effectively dead active servers
    const deadServers = await db
        .select()
        .from(servers)
        .where(
            and(
                eq(servers.status, 'active'),
                lte(servers.last_heartbeat, deadThreshold)
            )
        );

    if (deadServers.length === 0) return;

    console.log(`⚠️ Found ${deadServers.length} dead servers.`);

    for (const server of deadServers) {
        await db.transaction(async tx => {
            // Mark server DOWN
            await tx
                .update(servers)
                .set({ status: 'down', active_workers: 0 })
                .where(eq(servers.server_id, server.server_id));

            // Find affected workers
            const affectedWorkers = await tx
                .select()
                .from(workers)
                .where(
                    and(
                        eq(workers.server_id, server.server_id),
                        inArray(workers.status, [
                            'running',
                            'starting',
                            'pending',
                        ])
                    )
                );

            console.log(
                `🔄 Rescheduling ${affectedWorkers.length} workers from server ${server.server_id}...`
            );

            for (const worker of affectedWorkers) {
                // RESCHEDULE LOGIC
                // 1. Find new server
                // NOTE: We duplicate logic from Scheduler here or reuse it.
                // For simplicity and to avoid circular dependency issues or complex tx nesting,
                // we'll try to just call the logic inline or simpler:
                // Mark current worker as 'failed' (server died) and create a NEW placement?
                // Or update existing? Let's update existing to keep ID stable.

                // Find available server (excluding the dead one)
                // Since we marked it 'down' already in this TX, it won't be picked.
                const [bestServer] = await tx
                    .select()
                    .from(servers)
                    .where(
                        and(
                            eq(servers.status, 'active')
                            // Check capacity...
                            // sql`${servers.active_workers} < ${servers.max_workers}`
                        )
                    )
                    .orderBy(servers.active_workers)
                    .limit(1);

                if (!bestServer) {
                    console.error(
                        `❌ No capacity to reschedule worker ${worker.worker_id}`
                    );
                    // Mark as failed/stopped so client limit is freed?
                    // Or keep in 'pending' state?
                    await tx
                        .update(workers)
                        .set({ status: 'failed' }) // Human intervention or retry later
                        .where(eq(workers.worker_id, worker.worker_id));

                    // Update client usage? If 'failed', ideally we decrement used_workers so they can try again?
                    // Let's decrement.
                    await tx.execute(
                        sql`UPDATE clients SET used_workers = used_workers - 1 WHERE client_id = ${worker.client_id}`
                    );
                    continue;
                }

                // Relocate Worker
                await tx
                    .update(workers)
                    .set({
                        server_id: bestServer.server_id,
                        status: 'pending',
                        updated_at: new Date(),
                    })
                    .where(eq(workers.worker_id, worker.worker_id));

                // Update Server Counts
                await tx.execute(
                    sql`UPDATE servers SET active_workers = active_workers + 1 WHERE server_id = ${bestServer.server_id}`
                );

                // Re-dispatch via Service
                const { CommandDispatcher } =
                    await import('@/modules/commands/command.dispatcher');
                // We use the dispatcher to handle RPC and logging.
                // Note: The dispatcher creates its own DB entry for the command history.
                await CommandDispatcher.dispatchStartWorker(
                    bestServer.server_id,
                    worker.worker_id,
                    worker.client_id
                );
            }
        });
    }
}
