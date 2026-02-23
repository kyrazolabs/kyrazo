import { z } from 'zod';

// --- Base Types ---
export const RpcMessageSchema = z.object({
    id: z.string().uuid(),
    type: z.string(),
    payload: z.any(),
    timestamp: z.number(),
});
export type RpcMessage = z.infer<typeof RpcMessageSchema>;

// --- Server -> Agent Commands ---
export const StartWorkerPayloadSchema = z.object({
    workerId: z.string(),
    clientId: z.string(),
    image: z.string().optional(), // Docker image
    env: z.record(z.string(), z.string()),
    resources: z
        .object({
            cpu: z.string().default('1'),
            memory: z.string().default('2g'),
        })
        .optional(),
});
export type StartWorkerPayload = z.infer<typeof StartWorkerPayloadSchema>;

export const StopWorkerPayloadSchema = z.object({
    workerId: z.string(),
    force: z.boolean().default(false),
});
export type StopWorkerPayload = z.infer<typeof StopWorkerPayloadSchema>;

export const ServerToAgentSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('START_WORKER'),
        payload: StartWorkerPayloadSchema,
        id: z.string(),
        timestamp: z.number(),
    }),
    z.object({
        type: z.literal('STOP_WORKER'),
        payload: StopWorkerPayloadSchema,
        id: z.string(),
        timestamp: z.number(),
    }),
    z.object({
        type: z.literal('HEALTH_CHECK'),
        payload: z.null().optional(),
        id: z.string(),
        timestamp: z.number(),
    }),
]);
export type ServerToAgentMessage = z.infer<typeof ServerToAgentSchema>;

// --- Agent -> Server Events ---
export const AgentStatusSchema = z.object({
    agentId: z.string(),
    status: z.enum(['online', 'busy', 'offline']),
    resources: z.object({
        cpuUsage: z.number(),
        memoryUsage: z.number(),
        activeWorkers: z.number(),
    }),
    runningWorkers: z.array(z.string()).optional(),
});
export type AgentStatus = z.infer<typeof AgentStatusSchema>;

export const WorkerStatusPayloadSchema = z.object({
    workerId: z.string(),
    status: z.enum(['starting', 'running', 'stopped', 'failed']),
    error: z.string().optional(),
});
export type WorkerStatusPayload = z.infer<typeof WorkerStatusPayloadSchema>;

export const AgentToServerSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('CONNECT'),
        payload: z.object({
            clusterSecret: z.string(),
            nodeId: z.string(),
            system: z.object({
                cores: z.number(),
                memoryMB: z.number(),
                os: z.string(),
                maxWorkers: z.number(),
            }),
            ip: z.string().optional(),
        }),
        id: z.string(),
        timestamp: z.number(),
    }),
    z.object({
        type: z.literal('HEARTBEAT'),
        payload: AgentStatusSchema,
        id: z.string(),
        timestamp: z.number(),
    }),
    z.object({
        type: z.literal('WORKER_UPDATE'),
        payload: WorkerStatusPayloadSchema,
        id: z.string(),
        timestamp: z.number(),
    }),
    z.object({
        type: z.literal('ACK'),
        payload: z.object({
            originalMessageId: z.string(),
            success: z.boolean(),
            error: z.string().optional(),
        }),
        id: z.string(),
        timestamp: z.number(),
    }),
]);
export type AgentToServerMessage = z.infer<typeof AgentToServerSchema>;
