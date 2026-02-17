import { db } from '@/db';
import { clients, workers } from '@/db/schema';
import { Gateway } from '@/modules/gateway/gateway';
import { WorkerService } from '@/modules/workers/worker.service';
import { Plan, Subscription, Workspace } from '@kyrazo/shared';
import { and, eq, inArray } from 'drizzle-orm';

export class AutoScalerService {
    /**
     * Reconcile Desired State (Subscriptions) with Actual State (Gateway)
     */
    static async reconcile() {
        console.log('⚖️ Reconciling Worker State...');

        // 0. Sync Server Counts (Anti-Drift)
        try {
            await WorkerService.reconcileServerCounts();
        } catch (err: any) {
            console.warn(`[AutoScaler] Server sync error: ${err.message}`);
        }

        const subscriptions = await Subscription.find({ status: 'active' });

        for (const subscription of subscriptions) {
            await this.reconcileSubscription(subscription);
        }
    }

    private static async reconcileSubscription(subscription: any) {
        // 1. Resolve Dependencies
        const workspace = await Workspace.findById(subscription.workspaceId);
        if (!workspace) return;

        const plan = await Plan.findById(subscription.planId);
        if (!plan) return;

        // 2. Identify State
        const desiredWorkers = plan.limits.maxWorkers;
        const globalRunningIds = Gateway.getInstance().getGlobalRunningWorkers();
        let runningWorkerRecords: (typeof workers.$inferSelect)[] = [];

        // Fetch DB records for workers that are ACTUALLY running according to Agent
        if (globalRunningIds.length > 0) {
            runningWorkerRecords = await db
                .select()
                .from(workers)
                .where(
                    and(
                        eq(workers.client_id, subscription.workspaceId.toString()),
                        inArray(workers.worker_id, globalRunningIds)
                    )
                );
        }
        const actualWorkers = runningWorkerRecords.length;

        console.log(
            `[AuthScaler] Client ${subscription.workspaceId}: Desired=${desiredWorkers}, Actual=${actualWorkers}`
        );

        // 3. Sync & Cleanup State
        await this.syncState(subscription.workspaceId.toString(), globalRunningIds);

        // 4. Scale UP
        if (actualWorkers < desiredWorkers) {
            const toCreate = desiredWorkers - actualWorkers;
            console.log(`[AutoScaler] Scaling UP by ${toCreate}`);
            for (let i = 0; i < toCreate; i++) {
                await this.safeProvisionWorker(subscription.workspaceId.toString());
            }
        }

        // 5. Scale DOWN
        if (actualWorkers > desiredWorkers) {
            const toStop = actualWorkers - desiredWorkers;
            console.log(`[AutoScaler] Scaling DOWN by ${toStop}`);

            const extraWorkers = runningWorkerRecords
                .sort((a, b) => (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0))
                .slice(0, toStop);

            for (const worker of extraWorkers) {
                try {
                    await WorkerService.decommissionWorker(worker.worker_id);
                } catch (err) {
                    console.error('Failed to decommission worker:', err);
                }
            }
        }
    }

    /**
     * Sync DB State with Actual State.
     * Marks "Zombie" workers as failed and corrects used_workers count.
     */
    private static async syncState(clientId: string, runningWorkerIds: string[]) {
        const GRACE_PERIOD_MS = 60 * 1000; // 1 minute grace for "pending" starts
        const staleThreshold = new Date(Date.now() - GRACE_PERIOD_MS);

        // Find "Zombie" workers:
        // - status IN ('pending', 'starting', 'running')
        // - NOT IN runningWorkerIds
        // - created_at < staleThreshold (to give new ones a chance to start)
        const zombieWorkers = await db
            .select()
            .from(workers)
            .where(
                and(
                    eq(workers.client_id, clientId),
                    inArray(workers.status, ['pending', 'starting', 'running'])
                    // We need 'notInArray' but Drizzle might be tricky with empty arrays.
                    // Instead, filter in memory or specific query.
                    // Given we have runningWorkerIds, let's select ALL active-ish workers for client and filter.
                    // Or use `notInArray` if runningWorkerIds is not empty.
                )
            );

        let zombiesToKill: string[] = [];

        for (const w of zombieWorkers) {
            const isRunning = runningWorkerIds.includes(w.worker_id);
            const isStale = (w.created_at?.getTime() || 0) < staleThreshold.getTime();

            // Debug log
            // if (!isRunning) {
            //     console.log(
            //         `[AutoScaler] Checking candidate ${w.worker_id}: IsRunning=${isRunning}, IsStale=${isStale}, Server=${w.server_id}`
            //     );
            // }

            if (!isRunning && isStale) {
                zombiesToKill.push(w.worker_id);
            }
        }

        if (zombiesToKill.length > 0) {
            const gateway = Gateway.getInstance();

            for (const workerId of zombiesToKill) {
                const worker = zombieWorkers.find(w => w.worker_id === workerId);
                if (!worker) continue;

                if (!gateway.isAgentConnected(worker.server_id)) {
                    // Check if Agent is truly dead (no heartbeat for > 1 min)
                    const lastHeartbeat = gateway.getLastHeartbeat(worker.server_id);
                    const isDead = !lastHeartbeat || Date.now() - lastHeartbeat > 60000;

                    if (isDead) {
                        console.log(
                            `[AutoScaler] 💀 Agent ${worker.server_id} is dead (Last heartbeat: ${lastHeartbeat ? new Date(lastHeartbeat).toISOString() : 'Never'}). Marking worker ${workerId} as failed.`
                        );
                        await db
                            .update(workers)
                            .set({ status: 'failed' })
                            .where(eq(workers.worker_id, workerId));
                    } else {
                        console.log(
                            `[AutoScaler] Skipping cleanup for worker ${workerId} because server ${worker.server_id} is disconnected (but heartbeat is recent).`
                        );
                    }
                    continue;
                }

                console.log(
                    `[AutoScaler] Confirming zombie: ${workerId} on connected server ${worker.server_id}`
                );

                await db
                    .update(workers)
                    .set({ status: 'failed' })
                    .where(eq(workers.worker_id, workerId));
            }
        }

        // CORRECT counts using global reconciliation
        await WorkerService.reconcileClientCounts();
    }

    private static async safeProvisionWorker(clientId: string) {
        try {
            await WorkerService.provisionWorker(clientId);
        } catch (err: any) {
            console.warn(`[AutoScaler] Provisioning info: ${err.message}`);
        }
    }
}
