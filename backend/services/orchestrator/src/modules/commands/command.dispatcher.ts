import { db } from '@/db';
import { servers } from '@/db/schema';
import { config } from '@/common/config';
import { eq } from 'drizzle-orm';

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
    static async dispatchStartWorker(serverId: string, workerId: string, clientId: string) {
        // 1. Fetch Server from DB to get Coolify Target params
        const [server] = await db.select().from(servers).where(eq(servers.server_id, serverId));

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

                //  Worker Configuration
                WORKER_CONCURRENCY: process.env.WORKER_CONCURRENCY!,
                BATCH_SIZE: process.env.WORKER_BATCH_SIZE!,
                MAX_ACK_PENDING: process.env.WORKER_MAX_ACK_PENDING!,
                FETCH_TIMEOUT_MS: process.env.WORKER_FETCH_TIMEOUT_MS!,
                NODE_ENV: process.env.WORKER_NODE_ENV!,

                //  NATS Configuration
                NATS_SERVERS: process.env.WORKER_NATS_SERVERS!,
                NATS_USER: process.env.WORKER_NATS_USER!,
                NATS_PASSWORD: process.env.WORKER_NATS_PASSWORD!,
                NATS_MAX_RECONNECT_ATTEMPTS: process.env.WORKER_NATS_MAX_RECONNECT_ATTEMPTS!,
                NATS_RECONNECT_TIME_WAIT: process.env.WORKER_NATS_RECONNECT_TIME_WAIT!,
                NATS_TIMEOUT: process.env.WORKER_NATS_TIMEOUT!,
                NATS_CERT_FILE: process.env.WORKER_NATS_CERT_FILE!,
                NATS_KEY_FILE: process.env.WORKER_NATS_KEY_FILE!,
                NATS_CA_FILE: process.env.WORKER_NATS_CA_FILE!,

                //  Database Configuration
                MONGODB_URI: process.env.WORKER_MONGODB_URI!,
                DB_NAME: process.env.WORKER_DB_NAME!,
                MONGODB_MAX_POOL_SIZE: process.env.WORKER_MONGODB_MAX_POOL_SIZE!,
                MONGODB_MIN_POOL_SIZE: process.env.WORKER_MONGODB_MIN_POOL_SIZE!,

                //  Clickhouse Configuration
                CLICKHOUSE_URL: process.env.WORKER_CLICKHOUSE_URL!,
                CLICKHOUSE_HOST: process.env.WORKER_CLICKHOUSE_HOST!,
                CLICKHOUSE_USERNAME: process.env.WORKER_CLICKHOUSE_USERNAME!,
                CLICKHOUSE_PASSWORD: process.env.WORKER_CLICKHOUSE_PASSWORD!,
                CLICKHOUSE_DATABASE: process.env.WORKER_CLICKHOUSE_DATABASE!,

                //  Redis Configuration
                REDIS_DB: process.env.WORKER_REDIS_DB!,
                REDIS_HOST: process.env.WORKER_REDIS_HOST!,
                REDIS_PASSWORD: process.env.WORKER_REDIS_PASSWORD!,
                REDIS_PORT: process.env.WORKER_REDIS_PORT!,
                REDIS_URL: process.env.WORKER_REDIS_URL!,
                REDIS_USERNAME: process.env.WORKER_REDIS_USERNAME!,

                //  Background Jobs Configuration
                QUEUE_REDIS_DB: process.env.WORKER_QUEUE_REDIS_DB!,
                QUEUE_REDIS_HOST: process.env.WORKER_QUEUE_REDIS_HOST!,
                QUEUE_REDIS_PASSWORD: process.env.WORKER_QUEUE_REDIS_PASSWORD!,
                QUEUE_REDIS_PORT: process.env.WORKER_QUEUE_REDIS_PORT!,
                QUEUE_REDIS_URL: process.env.WORKER_QUEUE_REDIS_URL!,
                QUEUE_REDIS_USERNAME: process.env.WORKER_QUEUE_REDIS_USERNAME!,

                ENCRYPTION_KEY: process.env.WORKER_ENCRYPTION_KEY!,

                //  Logging Configuration
                LOG_LEVEL: process.env.WORKER_LOG_LEVEL!,
                LOG_FILE: process.env.WORKER_LOG_FILE!,
                ERROR_LOG_FILE: process.env.WORKER_ERROR_LOG_FILE!,
                APP_NAME: process.env.WORKER_APP_NAME!,
                APP_VERSION: process.env.WORKER_APP_VERSION!,
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
