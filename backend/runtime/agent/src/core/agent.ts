import { RpcClient } from './rpc-client';
import { DockerManager } from './docker';
import type { StartWorkerPayload, StopWorkerPayload } from '@kyrazo/shared';

export class Agent {
    private rpc: RpcClient;

    constructor() {
        const schedulerUrl = process.env.SCHEDULER_URL || 'ws://localhost:3300';
        const agentKey = process.env.AGENT_KEY || 'default-agent-key';

        this.rpc = new RpcClient(this, schedulerUrl, agentKey);
    }

    async start() {
        console.log('🤖 Starting Server Agent (Docker Mode)...');

        try {
            await DockerManager.checkHealth();
            console.log('✅ Docker is running');
        } catch (err) {
            console.error('❌ Docker check failed:', err);
            process.exit(1);
        }

        this.rpc.connect();

        // Reconcile existing containers
        await this.reconcileContainers();
    }

    async reconcileContainers() {
        try {
            const containers = await DockerManager.getRunningContainers();
            console.log(
                `🔄 Reconciling ${containers.length} existing containers...`
            );

            for (const workerId of containers) {
                this.rpc.send({
                    type: 'WORKER_UPDATE',
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    payload: { workerId, status: 'running' },
                });
            }
        } catch (err) {
            console.error('Failed to reconcile containers:', err);
        }
    }

    async handleStartWorker(payload: StartWorkerPayload, msgId: string) {
        try {
            await DockerManager.startContainer(payload);
            this.rpc.send({
                type: 'ACK',
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                payload: { originalMessageId: msgId, success: true },
            });

            // Notify Started
            this.rpc.send({
                type: 'WORKER_UPDATE',
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                payload: { workerId: payload.workerId, status: 'running' },
            });
        } catch (err) {
            console.error('Failed to start worker:', err);
            this.rpc.send({
                type: 'ACK',
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                payload: {
                    originalMessageId: msgId,
                    success: false,
                    error: (err as Error).message,
                },
            });
        }
    }

    async handleStopWorker(payload: StopWorkerPayload, msgId: string) {
        try {
            await DockerManager.stopContainer(payload.workerId, payload.force);
            this.rpc.send({
                type: 'ACK',
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                payload: { originalMessageId: msgId, success: true },
            });

            this.rpc.send({
                type: 'WORKER_UPDATE',
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                payload: { workerId: payload.workerId, status: 'stopped' },
            });
        } catch (err) {
            console.error('Failed to stop worker:', err);
            this.rpc.send({
                type: 'ACK',
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                payload: {
                    originalMessageId: msgId,
                    success: false,
                    error: (err as Error).message,
                },
            });
        }
    }

    async handleHealthCheck(msgId: string) {
        // Collect stats
        const os = require('os');
        const runningWorkers = await DockerManager.getRunningContainers();
        const stats = {
            cpuUsage: os.loadavg()[0], // simplified
            memoryUsage: 1 - os.freemem() / os.totalmem(),
            activeWorkers: runningWorkers.length,
        };

        this.rpc.send({
            type: 'HEARTBEAT',
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            payload: {
                agentId: 'self',
                status: 'online',
                resources: stats,
                runningWorkers,
            },
        });
    }

    async getHealth() {
        const os = require('os');
        const dockerHealthy = await (async () => {
            try {
                await DockerManager.checkHealth();
                return { status: 'healthy', details: 'Docker is running' };
            } catch (err) {
                return {
                    status: 'unhealthy',
                    details: (err as Error).message,
                };
            }
        })();

        const rpcStatus = this.rpc.getStatus();
        const rpcHealthy =
            rpcStatus === 'open'
                ? { status: 'healthy', details: 'Connected to Scheduler' }
                : { status: 'unhealthy', details: `RPC status: ${rpcStatus}` };

        const runningWorkers = await DockerManager.getRunningContainers();

        return {
            success:
                dockerHealthy.status === 'healthy' &&
                rpcHealthy.status === 'healthy',
            message:
                dockerHealthy.status === 'healthy' &&
                rpcHealthy.status === 'healthy'
                    ? 'Agent is healthy'
                    : 'Agent is unhealthy',
            services: {
                docker: dockerHealthy,
                rpc: rpcHealthy,
            },
            resources: {
                cpuUsage: os.loadavg()[0],
                memoryFree: os.freemem(),
                memoryTotal: os.totalmem(),
                uptime: os.uptime(),
            },
            activeWorkers: runningWorkers.length,
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        };
    }
}
