import type { ServerWebSocket } from 'bun';
import {
    type AgentToServerMessage,
    AgentToServerSchema,
    type ServerToAgentMessage,
} from '@kyrazo/shared';
// Since we are in dev, we might be importing source. But typically shared is built.
// For now, let's assume we can import from shared source if tsconfig allows, or I need to check tsconfig paths.

export class Gateway {
    private static instance: Gateway;
    // Map AgentId -> ServerWebSocket
    private agents: Map<string, ServerWebSocket<any>> = new Map();
    // Map AgentId -> Last Heartbeat
    private lastHeartbeat: Map<string, number> = new Map();

    // Map AgentId -> Running Worker IDs
    private runningWorkers: Map<string, string[]> = new Map();

    // Cache for API Key -> Server ID to avoid DB hits on every reconnect (optional, but good)
    // For now, let's hit DB or simple cache.
    private constructor() {}

    private readonly instanceId = crypto.randomUUID();

    // ...

    public static getInstance(): Gateway {
        if (!Gateway.instance) {
            Gateway.instance = new Gateway();
            console.log(
                `[Gateway] 🆕 Initialized Singleton Instance: ${Gateway.instance.instanceId}`
            );
        }
        return Gateway.instance;
    }

    public getGlobalRunningWorkers(): string[] {
        const allWorkers: string[] = [];
        for (const workers of this.runningWorkers.values()) {
            allWorkers.push(...workers);
        }
        return allWorkers;
    }

    public isAgentConnected(agentId: string): boolean {
        // Debug
        // console.log(
        //     `[Gateway ${this.instanceId}] Checking agent ${agentId} connection. Map keys: ${Array.from(this.agents.keys()).join(', ')}`
        // );
        return this.agents.has(agentId);
    }

    public getLastHeartbeat(agentId: string): number | undefined {
        return this.lastHeartbeat.get(agentId);
    }

    public handleConnection(ws: ServerWebSocket<any>) {
        console.log('New WebSocket connection established');
        console.log(`[Gateway] New connection. Current Map Size: ${this.agents.size}`);
    }

    public async handleMessage(ws: ServerWebSocket<any>, message: string | Buffer) {
        try {
            const raw = typeof message === 'string' ? message : message.toString();
            const json = JSON.parse(raw);
            const parsed = AgentToServerSchema.safeParse(json);

            if (!parsed.success) {
                console.error('Invalid RPC Message:', parsed.error);
                return;
            }

            const data = parsed.data;

            switch (data.type) {
                case 'CONNECT':
                    this.handleConnect(ws, data.payload.agentKey, data);
                    break;
                case 'HEARTBEAT':
                    this.handleHeartbeat(ws, data.payload);
                    break;
                case 'WORKER_UPDATE':
                    // Update Worker Status in DB
                    console.log('Worker Update:', data.payload);
                    const { WorkerService } = await import('@/modules/workers/worker.service');
                    await WorkerService.updateWorkerStatus(
                        data.payload.workerId,
                        data.payload.status
                    );

                    // Update Memory Map
                    // We need to know which agent sent this to update the map correctly
                    // We can iterate agents map to find the key for this ws
                    let agentId: string | undefined;
                    for (const [id, socket] of this.agents.entries()) {
                        if (socket === ws) {
                            agentId = id;
                            break;
                        }
                    }

                    if (agentId) {
                        const current = this.runningWorkers.get(agentId) || [];
                        if (data.payload.status === 'running') {
                            if (!current.includes(data.payload.workerId)) {
                                current.push(data.payload.workerId);
                                this.runningWorkers.set(agentId, current);
                            }
                        } else {
                            // Remove if stopped/failed
                            this.runningWorkers.set(
                                agentId,
                                current.filter(id => id !== data.payload.workerId)
                            );
                        }
                    }
                    break;
                case 'ACK':
                    console.log(
                        `Command ${data.payload.originalMessageId} Acked:`,
                        data.payload.success
                    );
                    break;
            }
        } catch (err) {
            console.error('Error handling WebSocket message:', err);
        }
    }

    public async handleClose(ws: ServerWebSocket<any>) {
        // Find agent by WS and remove
        for (const [agentId, socket] of this.agents.entries()) {
            if (socket === ws) {
                console.log(`Agent ${agentId} disconnected`);
                this.agents.delete(agentId);
                this.lastHeartbeat.delete(agentId);
                this.runningWorkers.delete(agentId);

                try {
                    const { db } = await import('@/db');
                    const { servers } = await import('@/db/schema');
                    const { eq } = await import('drizzle-orm');

                    // Immediately mark server as down for better reliability
                    await db
                        .update(servers)
                        .set({ status: 'down', active_workers: 0 })
                        .where(eq(servers.server_id, agentId));
                    console.log(`✅ Marked agent ${agentId} as DOWN in database.`);
                } catch (dbErr) {
                    console.error(`❌ Failed to update DB on agent ${agentId} disconnect:`, dbErr);
                }

                break;
            }
        }
    }

    public async handleConnect(ws: ServerWebSocket<any>, agentKey: string, data: any) {
        // Validate Agent Key against DB
        try {
            // Find server by API Key
            // We need to import db and servers schema.
            // Since this is inside class, let's use global db or import it at top.
            // I'll add imports in a separate block.

            // Temporary: Direct DB access here might be "messy" but practical for now.
            // Better: Use ServerController or Service.
            // Let's assume we can import `db` and `servers`.

            // import { db } from '@/db';
            // import { servers } from '@/db/schema';
            // import { eq } from 'drizzle-orm';

            // const [server] = await db.select().from(servers).where(eq(servers.api_key, agentKey));

            // Since I cannot change imports in the same chunk easily if they are far away,
            // I will implement the logic and add imports in another step or assume they are available
            // if I add them to the top of the file.

            // For this step, I will add the logic assuming imports exist.

            // Mocking the logic for the "replace" tool to succeed first, then I add imports.
            this.authenticateAgent(ws, agentKey, data.payload.ip);
        } catch (err) {
            console.error('Auth Failed', err);
            ws.close(1011, 'Auth Error');
        }
    }

    private async authenticateAgent(
        ws: ServerWebSocket<any>,
        agentKey: string,
        providedIp?: string
    ) {
        // Dynamic import to avoid circular dep issues at top level if any?
        // Or just standard import is fine.
        const { db } = await import('@/db');
        const { servers } = await import('@/db/schema');
        const { eq } = await import('drizzle-orm');

        const [server] = await db.select().from(servers).where(eq(servers.api_key, agentKey));

        if (!server) {
            console.log(`❌ Invalid Agent Key: ${agentKey}`);
            ws.close(1008, 'Invalid API Key');
            return;
        }

        const agentId = server.server_id;
        const remoteIp = providedIp || ws.remoteAddress || null;

        console.log(
            `✅ Agent Authenticated: ${agentId} (Server: ${server.server_id}) from IP: ${remoteIp}`
        );

        // Update server IP and mark as active
        await db
            .update(servers)
            .set({
                ip: remoteIp,
                status: 'active',
                last_heartbeat: new Date(),
            })
            .where(eq(servers.server_id, agentId));

        this.agents.set(agentId, ws);
        ws.data = { agentId };
    }

    private handleHeartbeat(ws: ServerWebSocket<any>, status: any) {
        const agentId = ws.data?.agentId;
        if (!agentId) return;

        this.lastHeartbeat.set(agentId, Date.now());
        if (status.runningWorkers) {
            this.runningWorkers.set(agentId, status.runningWorkers);
            console.log(
                `[Gateway] ❤️ Heartbeat from ${agentId}: ${status.runningWorkers.length} workers (${status.runningWorkers.join(', ')})`
            );
        } else {
            // If payload is missing runningWorkers, assume empty or don't update?
            // Safest is to not update if undefined, but Agent SHOULD send it.
            console.log(`[Gateway] ❤️ Heartbeat from ${agentId} (No worker data)`);
        }
    }

    public send(agentId: string, message: ServerToAgentMessage) {
        const ws = this.agents.get(agentId);
        if (!ws) {
            console.warn(`Attempt to send to disconnected agent ${agentId}`);
            // throw new Error(`Agent ${agentId} not connected`); // Don't crash scheduler
            return;
        }
        ws.send(JSON.stringify(message));
    }
}
