import { db } from '@/db';
import { serverCommands } from '@/db/schema';
import { signCommand } from '@/helper/hamc';
import { Gateway } from '@/modules/gateway/gateway';
import type {
    ServerToAgentMessage,
    StartWorkerPayload,
    StopWorkerPayload,
} from '@kyrazo/shared';
import { v4 as uuidv4 } from 'uuid';

export class CommandDispatcher {
    /**
     * Dispatch a START_WORKER command via DB Queue and RPC
     */
    static async dispatchStartWorker(
        serverId: string,
        workerId: string,
        clientId: string
    ) {
        const payload = {
            workerId,
            clientId,
            ts: Date.now(),
        };

        // 1. Sign & Queue in DB (Reliability)
        const { signature, timestamp, nonce } = await signCommand(
            JSON.stringify({ ...payload, serverId })
        );

        await db.insert(serverCommands).values({
            server_id: serverId,
            type: 'START_WORKER',
            payload,
            signature,
            timestamp,
            nonce,
        });

        // 2. Send via RPC (Real-time)
        try {
            const rpcMessage: ServerToAgentMessage = {
                type: 'START_WORKER',
                id: uuidv4(),
                timestamp: Date.now(),
                payload: {
                    workerId,
                    clientId,
                    env: {
                        WORKSPACE_ID: clientId,
                        WORKER_ID: workerId,
                    },
                },
            };
            Gateway.getInstance().send(serverId, rpcMessage);
            console.log(
                `🚀 Dispatched START_WORKER to ${serverId} for worker ${workerId}`
            );
        } catch (err) {
            console.warn(
                `Failed to send RPC to server ${serverId}, command queued in DB`,
                err
            );
        }
    }

    /**
     * Dispatch a STOP_WORKER command via DB Queue and RPC
     */
    static async dispatchStopWorker(
        serverId: string,
        workerId: string,
        clientId: string,
        force = false
    ) {
        const payload = {
            workerId,
            clientId, // Included for context/verification
            ts: Date.now(),
        };

        // 1. Sign & Queue in DB
        const { signature, timestamp, nonce } = await signCommand(
            JSON.stringify({ ...payload, serverId })
        );

        await db.insert(serverCommands).values({
            server_id: serverId,
            type: 'STOP_WORKER',
            payload,
            signature,
            timestamp,
            nonce,
        });

        // 2. Send via RPC
        try {
            const rpcMessage: ServerToAgentMessage = {
                type: 'STOP_WORKER',
                id: uuidv4(),
                timestamp: Date.now(),
                payload: {
                    workerId,
                    force,
                },
            };
            Gateway.getInstance().send(serverId, rpcMessage);
            console.log(
                `🛑 Dispatched STOP_WORKER to ${serverId} for worker ${workerId}`
            );
        } catch (err) {
            console.warn(
                `Failed to send RPC to server ${serverId}, command queued in DB`,
                err
            );
        }
    }
}
