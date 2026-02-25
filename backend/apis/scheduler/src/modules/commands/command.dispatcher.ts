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
                repository: config.COOLIFY_REPOSITORY,
                branch: config.COOLIFY_BRANCH,
                name: appName,
                descriptions: `This worker ${workerId} is dedicated for client ${clientId}`,
                build_pack: 'dockerfile',
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
                MONGODB_URI: process.env.MONGODB_URI || '',
                REDIS_URL: process.env.REDIS_URL || '',
                NATS_SERVERS: process.env.NATS_SERVERS || '',
                NATS_USER: process.env.NATS_USER || '',
                NATS_PASSWORD: process.env.NATS_PASSWORD || '',
                CLICKHOUSE_URL: process.env.CLICKHOUSE_URL || '',
                CLICKHOUSE_HOST: process.env.CLICKHOUSE_HOST || '',
                ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',
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
        } catch (err) {
            console.error(
                `[CommandDispatcher] Failed to dispatch Coolify Worker ${workerId}:`,
                err
            );
        }
    }

    static async dispatchStopWorker(
        serverId: string,
        workerId: string,
        clientId: string,
        force = false
    ) {
        // 1. Fetch all applications and delete the corresponding worker (Auto-Scale Down)
        try {
            const apps = await getApplications();
            const targetApp = apps?.find((app: any) => app.name === `Worker - ${workerId}`);

            if (targetApp && targetApp.uuid) {
                // DELETE /applications/{uuid} destroys the Coolify App entirely.
                await deleteApplication(targetApp.uuid);
                console.log(`🛑 Coolify Auto-Scaled DOWN worker ${workerId} on Server ${serverId}`);
            } else {
                console.warn(
                    `[CommandDispatcher] Could not find Coolify application named "Worker - ${workerId}" to scale down.`
                );
            }
        } catch (err) {
            console.error(
                `[CommandDispatcher] Failed to terminate Coolify Worker ${workerId}:`,
                err
            );
        }
    }
}
