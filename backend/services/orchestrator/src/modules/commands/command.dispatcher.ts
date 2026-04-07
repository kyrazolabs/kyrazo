import { OrchestratorServer, WorkerStatus } from '@/db';
import { config } from '@/common/config';

import {
    createGitHubApp,
    bulkInjectEnvs,
    startApplication,
    getApplications,
    deleteApplication,
} from '@/modules/coolify/actions';

export class CommandDispatcher {
    /**
     * Dispatch a START_WORKER command via DB Queue and Coolify API (Auto-Scale Up)
     */
    static async dispatchStartWorker(
        serverId: string,
        workerId: string,
        clientId: string,
        workersCount: number = 1
    ) {
        // 1. Fetch Server from DB to get Coolify Target params
        const server = await OrchestratorServer.findOne({ server_id: serverId });

        if (
            !server ||
            !server.coolify_server_uuid ||
            !server.coolify_project_uuid ||
            !server.coolify_environment_uuid
        ) {
            console.warn(
                `[CommandDispatcher] Server ${serverId} is missing Coolify routing UUIDs. Aborting automated deployment.`
            );
            return;
        }

        try {
            // 3. Create Private GitHub App Application directly on Coolify
            const appName = `Worker - ${workerId}`;
            const createPayload = {
                server_uuid: server.coolify_server_uuid,
                project_uuid: server.coolify_project_uuid,
                environment_uuid: server.coolify_environment_uuid,
                github_app_uuid: config.COOLIFY_GITHUB_APP_UUID,
                name: appName,
                description: `This worker ${workerId} is dedicated for client ${clientId}`,
                limits_cpus: workersCount.toString(),
                build_pack: 'dockercompose',
            };

            const appRes = await createGitHubApp(createPayload);

            // Note: The response shape depends on Coolify version, assuming it returns { uuid: '...' } at top level
            const appUuid = appRes?.uuid;

            if (!appUuid) {
                throw new Error(`Failed to retrieve Application UUID from creation response.`);
            }

            // 4. Inject Environment Variables into the new Application
            const envsToInject = {
                WORKSPACE_ID: clientId,
                WORKER_ID: workerId,

                // ================ WORKER CONFIGURATION ================ //
                WORKERS: workersCount.toString(),
                NODE_ENV: '{{ environment.WORKER_NODE_ENV }}',
                BATCH_SIZE: '{{ environment.BATCH_SIZE }}',
                CONCURRENCY: '{{ environment.WORKER_CONCURRENCY }}',
                MAX_ACK_PENDING: '{{ environment.MAX_ACK_PENDING }}',
                FETCH_TIMEOUT_MS: '{{ environment.FETCH_TIMEOUT_MS }}',

                // NATS Configuration
                NATS_SERVERS: '{{ project.NATS_SERVERS }}',
                NATS_USER: '{{ project.WORKER_NATS_USER }}',
                NATS_PASSWORD: '{{ project.WORKER_NATS_PASS }}',
                NATS_MAX_RECONNECT_ATTEMPTS: '{{ environment.NATS_MAX_RECONNECT_ATTEMPTS }}',
                NATS_RECONNECT_TIME_WAIT: '{{ environment.NATS_RECONNECT_TIME_WAIT }}',
                NATS_TIMEOUT: '{{ environment.NATS_TIMEOUT }}',
                NATS_CERT_FILE: '{{ environment.NATS_CERT_FILE }}',
                NATS_KEY_FILE: '{{ environment.NATS_KEY_FILE }}',
                NATS_CA_FILE: '{{ environment.NATS_CA_FILE }}',
                NATS_TLS: '{{ environment.NATS_TLS }}',

                //  Database Configuration
                MONGODB_URI: '{{ project.MONGODB_URI }}',
                MONGODB_DB_NAME: '{{ project.MONGODB_DB_NAME }}',
                MONGODB_MAX_POOL_SIZE: '{{ environment.MONGODB_MAX_POOL_SIZE}}',
                MONGODB_MIN_POOL_SIZE: '{{ environment.MONGODB_MIN_POOL_SIZE}}',
                MONGODB_SSL: '{{ project.MONGODB_SSL}}',
                MONGODB_CA_FILE: '{{ environment.MONGODB_CA_FILE}}',

                //  Redis Configuration
                REDIS_URL: '{{ project.REDIS_URL }}',
                REDIS_TLS: '{{ project.REDIS_TLS }}',
                QUEUE_REDIS_URL: '{{ project.QUEUE_REDIS_URL }}',
                QUEUE_REDIS_TLS: '{{ project.QUEUE_REDIS_TLS }}',
                STREAM_REDIS_URL: '{{ project.STREAM_REDIS_URL }}',
                STREAM_REDIS_TLS: '{{ project.STREAM_REDIS_TLS }}',

                ENCRYPTION_KEY: '{{ project.ENCRYPTION_KEY }}',
            };

            const envData = Object.entries(envsToInject)
                .filter(([_, value]) => !!value)
                .map(([key, value]) => ({ key, value }));

            if (envData.length > 0) {
                await bulkInjectEnvs(appUuid, envData);
            }

            // 5. Start the Application Container (Auto-Scale Up)
            await startApplication(appUuid);

            console.log(`🚀 Coolify Auto-Scaled UP worker ${workerId} on Server ${serverId}`);
        } catch (err: any) {
            console.error(
                `[CommandDispatcher] Failed to dispatch Coolify Worker ${workerId}:`,
                err
            );
            // Rethrow so WorkerService can rollback DB if needed
            throw err;
        }
    }

    static async dispatchStopWorker(
        serverId: string,
        workerId: string,
        clientId: string,
        force = false,
        apps?: any[]
    ) {
        // 1. Fetch all applications and delete the corresponding worker (Auto-Scale Down)
        try {
            const allApps = apps || (await getApplications());
            const targetApp = allApps?.find((app: any) => app.name === `Worker - ${workerId}`);

            if (targetApp && targetApp.uuid) {
                // DELETE /applications/{uuid} destroys the Coolify App entirely.
                await deleteApplication(targetApp.uuid);
                console.log(`🛑 Coolify Auto-Scaled DOWN worker ${workerId} on Server ${serverId}`);
            } else {
                console.warn(
                    `[CommandDispatcher] Could not find Coolify application named "Worker - ${workerId}" to scale down.`
                );
            }
        } catch (err: any) {
            console.error(
                `[CommandDispatcher] Failed to terminate Coolify Worker ${workerId}:`,
                err
            );
        }
    }
}
