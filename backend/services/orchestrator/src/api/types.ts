// DTOs + Types

export interface RegisterPayload {
    serverId?: string;
    hostname: string;
    ip: string;
    cores: number;
    maxWorkers: number;
}

export interface HeartbeatPayload {
    serverId: string;
    activeWorkers: number;
    cpuLoad: number;
    memoryUsage: number;
}

export type CommandType = 'START_WORKER' | 'STOP_WORKER' | 'DRAIN_SERVER';

export interface Command {
    commandId: string;
    type: CommandType;
    payload: Record<string, any>;
}
