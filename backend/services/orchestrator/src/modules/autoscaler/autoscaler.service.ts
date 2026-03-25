import { OrchestratorClient, OrchestratorWorker, WorkerStatus } from '@/db';
import { WorkerService } from '@/modules/workers/worker.service';
import { WorkerRepo } from '@/modules/workers/worker.repo';
import { CommandDispatcher } from '@/modules/commands/command.dispatcher';
import { Plan, Subscription, Workspace } from '@kyrazo/shared';
import { config } from '@/common/config';

import { getApplications, getDeployments } from '@/modules/coolify/actions';

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
        } catch (err: any) {
            console.error('[AutoScaler] Failed to fetch apps for reconciliation:', err);
        }
        const kyrazoApps = allApps.filter(
            (app: any) => app.name && app.name.startsWith('Worker - ')
        );

        // 1. Reap stale terminated workers
        try {
            await WorkerService.reapStaleWorkers(kyrazoApps);
        } catch (err: any) {
            console.warn(`[AutoScaler] Stale worker reaping error: ${err.message}`);
        }

        // 2. Reconcile server active_workers counts
        try {
            await WorkerService.reconcileServerCounts();
        } catch (err: any) {
            console.warn(`[AutoScaler] Server sync error: ${err.message}`);
        }

        // 3. Fetch ALL known clients that have workers in active state
        const activeClientsRes = await OrchestratorWorker.distinct('client_id', {
            status: { $in: [WorkerStatus.PENDING, WorkerStatus.STARTING, WorkerStatus.RUNNING, WorkerStatus.STOPPING] }
        });

        const clientsWithWorkers = new Set(activeClientsRes);

        // 4. Fetch all ACTIVE/TRIALING subscriptions from Mongo
        const subscriptions = await Subscription.find({
            status: { $in: ['active', 'trialing'] },
        });

        // 5. Merge both lists
        const subscriptionClientMap = new Map(
            subscriptions.map(s => [s.workspaceId.toString(), s])
        );

        // Final set of client IDs to process
        const allClientIds = new Set([...clientsWithWorkers, ...subscriptionClientMap.keys()]);

        // 6. Cleanup Orphans
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

            const workerRecord = await OrchestratorWorker.findOne({ worker_id: workerId });

            if (!workerRecord) {
                console.warn(`[AutoScaler] Found orphaned Coolify app: ${app.name}. Deleting.`);
                try {
                    await CommandDispatcher.dispatchStopWorker('', workerId, '', true);
                } catch (err: any) {
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
                maxWorkers =
                    subscription.planSnapshot?.limits?.maxWorkers ?? plan.limits.maxWorkers;
                // Sync limit
                await WorkerRepo.upsertClient(clientIdStr, maxWorkers);
            }
        }

        const desiredWorkers = maxWorkers;

        // 2. Sync & Health Check
        await this.syncState(clientIdStr, kyrazoApps);

        // 3. Identify Actual ACTIVE Workers
        const runningWorkerRecords = await OrchestratorWorker.find({
            client_id: clientIdStr,
            status: { $in: [WorkerStatus.PENDING, WorkerStatus.STARTING, WorkerStatus.RUNNING] }
        });

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
                } catch (err: any) {
                    console.error('Failed to decommission worker:', err);
                }
            }
        }
    }

    /**
     * Sync DB State with Actual (Coolify) State.
     */
    private static async syncState(clientId: string, kyrazoApps: any[]) {
        const GRACE_PERIOD_MS = 2 * 60 * 1000;
        const staleThreshold = new Date(Date.now() - GRACE_PERIOD_MS);

        const activeWorkers = await OrchestratorWorker.find({
            client_id: clientId,
            status: { $in: [WorkerStatus.PENDING, WorkerStatus.STARTING, WorkerStatus.RUNNING, WorkerStatus.STOPPING] }
        });

        for (const w of activeWorkers) {
            const app = kyrazoApps.find(a => a.name === `Worker - ${w.worker_id}`);
            const isStale = (w.created_at?.getTime() || 0) < staleThreshold.getTime();

            if (app) {
                const coolifyStatus = app.status?.toLowerCase() || '';

                if (
                    [WorkerStatus.PENDING, WorkerStatus.STARTING].includes(w.status as any) &&
                    coolifyStatus.includes('running')
                ) {
                    console.log(`[AutoScaler] Worker ${w.worker_id} confirmed RUNNING in Coolify.`);
                    await WorkerService.updateWorkerStatus(w.worker_id, WorkerStatus.RUNNING);
                }

                const isUnhealthy =
                    ['exited', 'unhealthy', 'degraded', 'error'].some(s =>
                        coolifyStatus.includes(s)
                    ) ||
                    (coolifyStatus.includes('running') && coolifyStatus.includes('unhealthy'));

                if (isUnhealthy) {
                    try {
                        const deploymentRes = await getDeployments(app.uuid);
                        const hasActiveDeployment = deploymentRes?.deployments?.some(
                            (d: any) => d.status === 'in_progress' || d.status === 'queued'
                        );

                        if (hasActiveDeployment) {
                            console.log(
                                `[AutoScaler] Worker ${w.worker_id} is unhealthy but has an active deployment. Skipping reaping.`
                            );
                            continue;
                        }
                    } catch (err: any) {
                        console.error(
                            `[AutoScaler] Failed to check deployments for ${w.worker_id}:`,
                            err
                        );
                        continue;
                    }

                    console.warn(
                        `[AutoScaler] Worker ${w.worker_id} is ${coolifyStatus} in Coolify. Reaping (mark failed + delete app).`
                    );
                    await WorkerService.updateWorkerStatus(w.worker_id, WorkerStatus.FAILED);
                    try {
                        await CommandDispatcher.dispatchStopWorker(
                            '',
                            w.worker_id,
                            '',
                            true,
                            kyrazoApps
                        );
                    } catch (err: any) {
                        console.error(
                            `[AutoScaler] Failed to delete unhealthy worker app ${w.worker_id}:`,
                            err
                        );
                    }
                }
            } else {
                if (isStale && [WorkerStatus.PENDING, WorkerStatus.STARTING, WorkerStatus.RUNNING].includes(w.status as any)) {
                    console.log(
                        `[AutoScaler] Confirming zombie: ${w.worker_id} missing from Coolify after grace period. Marking as failed.`
                    );
                    await WorkerService.updateWorkerStatus(w.worker_id, WorkerStatus.FAILED);
                }

                if (w.status === WorkerStatus.STOPPING) {
                    console.log(
                        `[AutoScaler] Worker ${w.worker_id} successfully stopped in Coolify. Marking as stopped.`
                    );
                    await WorkerService.updateWorkerStatus(w.worker_id, WorkerStatus.STOPPED);
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
