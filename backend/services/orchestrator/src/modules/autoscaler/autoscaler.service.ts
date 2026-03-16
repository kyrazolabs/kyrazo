import { db } from '@/db';
import { clients, workers } from '@/db/schema';
import { WorkerService } from '@/modules/workers/worker.service';
import { WorkerRepo } from '@/modules/workers/worker.repo';
import { CommandDispatcher } from '@/modules/commands/command.dispatcher';
import { Plan, Subscription, Workspace } from '@kyrazo/shared';
import { and, eq, inArray } from 'drizzle-orm';
import { config } from '@/common/config';

import { getApplications } from '@/modules/coolify/actions';

export class AutoScalerService {
    /**
     * Reconcile Desired State (Subscriptions) with Actual State (Coolify Apps)
     */
    static async reconcile() {
        console.log('⚖️ Reconciling Worker State...');

        // 0. Fetch global Coolify state ONCE per reconciliation loop
        let allApps: any[] = [];
        try {
            allApps = (await getApplications()) || [];
        } catch (err) {
            console.error('[AutoScaler] Failed to fetch apps for reconciliation:', err);
        }
        const kyrazoApps = allApps.filter(
            (app: any) => app.name && app.name.startsWith('Worker - ')
        );

        // 1. Reap stale terminated workers (stopped/failed for > 1 hour)
        try {
            await WorkerService.reapStaleWorkers(kyrazoApps);
        } catch (err: any) {
            console.warn(`[AutoScaler] Stale worker reaping error: ${err.message}`);
        }

        // 2. Reconcile server active_workers counts from actual worker records
        try {
            await WorkerService.reconcileServerCounts();
        } catch (err: any) {
            console.warn(`[AutoScaler] Server sync error: ${err.message}`);
        }

        // 3. Fetch ALL known clients that have workers in active state
        const activeClientsRes = await db
            .select({ clientId: workers.client_id })
            .from(workers)
            .where(inArray(workers.status, ['pending', 'starting', 'running', 'stopping']))
            .groupBy(workers.client_id);

        const clientsWithWorkers = new Set(activeClientsRes.map(c => c.clientId));

        // 4. Fetch all ACTIVE/TRIALING subscriptions from Mongo
        const subscriptions = await Subscription.find({
            status: { $in: ['active', 'trialing'] },
        });

        // 5. Merge both lists to ensure we process everyone:
        // - Those who have a subscription (Scale UP/DOWN)
        // - Those who have NO subscription but have workers (Scale DOWN to 0)
        const subscriptionClientMap = new Map(subscriptions.map(s => [s.workspaceId.toString(), s]));

        // Final set of client IDs to process
        const allClientIds = new Set([...clientsWithWorkers, ...subscriptionClientMap.keys()]);

        // 6. Cleanup Orphans: Coolify apps that don't have a record in PG workers
        await this.cleanupOrphans(kyrazoApps);

        // 7. Process each client
        for (const clientId of allClientIds) {
            const subscription = subscriptionClientMap.get(clientId);
            await this.reconcileSubscription(clientId, subscription, kyrazoApps);
        }

        // 8. Final sync of counts
        await WorkerService.reconcileClientCounts();
    }

    /**
     * Delete Coolify applications that don't exist in our DB records (Orphans)
     */
    private static async cleanupOrphans(kyrazoApps: any[]) {
        for (const app of kyrazoApps) {
            const workerId = app.name.replace('Worker - ', '');
            if (!workerId) continue;

            const [workerRecord] = await db
                .select()
                .from(workers)
                .where(eq(workers.worker_id, workerId));

            // If no DB record, it's a leak — delete the Coolify app
            if (!workerRecord) {
                console.warn(`[AutoScaler] Found orphaned Coolify app: ${app.name}. Deleting.`);
                try {
                    await CommandDispatcher.dispatchStopWorker('', workerId, '', true);
                } catch (err) {
                    console.error(`[AutoScaler] Failed to delete orphan ${workerId}:`, err);
                }
            }
        }
    }

    private static async reconcileSubscription(
        clientIdStr: string,
        subscription: any,
        kyrazoApps: any[]
    ) {
        // 1. Resolve Limits
        let maxWorkers = 0;

        if (subscription) {
            const workspace = await Workspace.findById(subscription.workspaceId);
            const plan = await Plan.findById(subscription.planId);

            if (workspace && plan) {
                maxWorkers = subscription.planSnapshot?.limits?.maxWorkers ?? plan.limits.maxWorkers;
                // Sync limit to PG
                await WorkerRepo.upsertClient(db, clientIdStr, maxWorkers);
            }
        }

        const desiredWorkers = maxWorkers;

        // 2. Sync & Health Check (Verify health and sync pending -> running)
        await this.syncState(clientIdStr, kyrazoApps);

        // 3. Identify Actual ACTIVE Workers for this specific client AFTER sync
        const runningWorkerRecords = await db
            .select()
            .from(workers)
            .where(
                and(
                    eq(workers.client_id, clientIdStr),
                    inArray(workers.status, ['pending', 'starting', 'running'])
                )
            );

        const actualWorkers = runningWorkerRecords.length;

        if (actualWorkers > 0 || desiredWorkers > 0) {
            console.log(
                `[AutoScaler] Client ${clientIdStr}: Desired=${desiredWorkers}, Actual=${actualWorkers}`
            );
        }

        // 4. Scale UP
        if (actualWorkers < desiredWorkers) {
            const toCreate = desiredWorkers - actualWorkers;
            console.log(`[AutoScaler] Scaling UP by ${toCreate}`);
            for (let i = 0; i < toCreate; i++) {
                await this.safeProvisionWorker(clientIdStr);
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
                    await WorkerService.decommissionWorker(worker.worker_id, kyrazoApps);
                } catch (err) {
                    console.error('Failed to decommission worker:', err);
                }
            }
        }
    }

    /**
     * Sync DB State with Actual (Coolify) State.
     *
     * Strategy: Reap-and-Replace
     * - Transition pending/starting -> running when confirmed by Coolify
     * - Mark unhealthy workers as failed AND delete their Coolify apps immediately
     * - Mark zombie workers (missing from Coolify after grace period) as failed
     *
     * The next reconcile loop will see fewer actual workers and provision fresh ones.
     */
    private static async syncState(
        clientId: string,
        kyrazoApps: any[]
    ) {
        const GRACE_PERIOD_MS = 2 * 60 * 1000; // 2 minutes grace for "pending" starts
        const staleThreshold = new Date(Date.now() - GRACE_PERIOD_MS);

        const activeWorkers = await db
            .select()
            .from(workers)
            .where(
                and(
                    eq(workers.client_id, clientId),
                    inArray(workers.status, ['pending', 'starting', 'running', 'stopping'])
                )
            );

        for (const w of activeWorkers) {
            const app = kyrazoApps.find(a => a.name === `Worker - ${w.worker_id}`);
            const isStale = (w.created_at?.getTime() || 0) < staleThreshold.getTime();

            if (app) {
                // Coolify returns status in lowercase usually (running, exited, starting, etc.)
                const coolifyStatus = app.status?.toLowerCase() || '';

                // Case 1: Transition Pending/Starting -> Running
                if (
                    ['pending', 'starting'].includes(w.status) &&
                    coolifyStatus.includes('running')
                ) {
                    console.log(`[AutoScaler] Worker ${w.worker_id} confirmed RUNNING in Coolify.`);
                    await WorkerService.updateWorkerStatus(w.worker_id, 'running');
                }

                // Case 2: Transition to Failed if Exited or Unhealthy
                const isUnhealthy =
                    ['exited', 'unhealthy', 'degraded', 'error'].some(s =>
                        coolifyStatus.includes(s)
                    ) ||
                    (coolifyStatus.includes('running') && coolifyStatus.includes('unhealthy'));

                if (isUnhealthy) {
                    console.warn(
                        `[AutoScaler] Worker ${w.worker_id} is ${coolifyStatus} in Coolify. Reaping (mark failed + delete app).`
                    );
                    // Reap-and-replace: mark failed (releases resources) then delete Coolify app
                    await WorkerService.updateWorkerStatus(w.worker_id, 'failed');
                    try {
                        await CommandDispatcher.dispatchStopWorker('', w.worker_id, '', true, kyrazoApps);
                    } catch (err) {
                        console.error(`[AutoScaler] Failed to delete unhealthy worker app ${w.worker_id}:`, err);
                    }
                }
            } else {
                // Case 3: Worker should be running but is missing entirely from Coolify
                if (isStale && ['pending', 'starting', 'running'].includes(w.status)) {
                    console.log(
                        `[AutoScaler] Confirming zombie: ${w.worker_id} missing from Coolify after grace period. Marking as failed.`
                    );
                    await WorkerService.updateWorkerStatus(w.worker_id, 'failed');
                }

                // Case 4: Worker was supposed to stop and is now gone from Coolify
                if (w.status === 'stopping') {
                    console.log(`[AutoScaler] Worker ${w.worker_id} successfully stopped in Coolify. Marking as stopped.`);
                    await WorkerService.updateWorkerStatus(w.worker_id, 'stopped');
                }
            }
        }
    }

    private static async safeProvisionWorker(clientId: string) {
        try {
            await WorkerService.provisionWorker(clientId);
        } catch (err: any) {
            console.error(`[AutoScaler] Provisioning failed for client ${clientId}:`, err);
            console.warn(`[AutoScaler] Provisioning info: ${err.message}`);
        }
    }
}
