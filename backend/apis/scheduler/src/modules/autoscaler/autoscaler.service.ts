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

        try {
            await WorkerService.reconcileServerCounts();
        } catch (err: any) {
            console.warn(`[AutoScaler] Server sync error: ${err.message}`);
        }

        const subscriptions = await Subscription.find({
            status: { $in: ['active', 'trialing'] },
        });

        // Fetch global state from Coolify ONCE per reconciliation loop
        let allApps = [];
        try {
            allApps = (await getApplications()) || [];
        } catch (err) {
            console.error('[AutoScaler] Failed to fetch apps for reconciliation:', err);
        }
        // Filter out applications that match our Kyrazo Worker naming convention
        const kyrazoApps = allApps.filter(
            (app: any) => app.name && app.name.startsWith('Worker - ')
        );

        for (const subscription of subscriptions) {
            await this.reconcileSubscription(subscription, kyrazoApps);
        }
    }

    private static async reconcileSubscription(subscription: any, kyrazoApps: any[]) {
        // 1. Resolve Dependencies
        const workspace = await Workspace.findById(subscription.workspaceId);
        if (!workspace) return;

        const plan = await Plan.findById(subscription.planId);
        if (!plan) return;

        // 2. Identify State
        // Ensure the client exists and limits are synced to Postgres
        const maxWorkers =
            subscription.planSnapshot?.limits?.maxWorkers ?? plan.limits.maxWorkers;
        await WorkerRepo.upsertClient(db, subscription.workspaceId.toString(), maxWorkers);

        const desiredWorkers = maxWorkers;
        const clientIdStr = subscription.workspaceId.toString();

        // Find which worker IDs are actually registered as running in Coolify
        const runningWorkerIds = kyrazoApps
            .map(app => app.name.replace('Worker - ', ''))
            .filter(id => id.length > 0);

        let runningWorkerRecords: (typeof workers.$inferSelect)[] = [];

        // Fetch DB records for workers that are ACTUALLY running according to Coolify
        if (runningWorkerIds.length > 0) {
            runningWorkerRecords = await db
                .select()
                .from(workers)
                .where(
                    and(
                        eq(workers.client_id, clientIdStr),
                        inArray(workers.worker_id, runningWorkerIds)
                    )
                );
        }

        const actualWorkers = runningWorkerRecords.length;

        console.log(
            `[AutoScaler] Client ${clientIdStr}: Desired=${desiredWorkers}, Actual=${actualWorkers}`
        );

        // 3. Sync & Cleanup State
        await this.syncState(clientIdStr, runningWorkerIds);

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
    private static async syncState(clientId: string, runningWorkerIdsFromCoolify: string[]) {
        const GRACE_PERIOD_MS = 60 * 1000; // 1 minute grace for "pending" starts
        const staleThreshold = new Date(Date.now() - GRACE_PERIOD_MS);

        const zombieWorkers = await db
            .select()
            .from(workers)
            .where(
                and(
                    eq(workers.client_id, clientId),
                    inArray(workers.status, ['pending', 'starting', 'running'])
                )
            );

        let zombiesToKill: string[] = [];

        for (const w of zombieWorkers) {
            const isRunningInCoolify = runningWorkerIdsFromCoolify.includes(w.worker_id);
            const isStale = (w.created_at?.getTime() || 0) < staleThreshold.getTime();

            if (!isRunningInCoolify && isStale) {
                zombiesToKill.push(w.worker_id);
            }
        }

        if (zombiesToKill.length > 0) {
            for (const workerId of zombiesToKill) {
                console.log(
                    `[AutoScaler] Confirming zombie: ${workerId} is apparently not running in Coolify. Marking as failed.`
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
            console.error(`[AutoScaler] Provisioning failed for client ${clientId}:`, err);
            console.warn(`[AutoScaler] Provisioning info: ${err.message}`);
        }
    }
}
