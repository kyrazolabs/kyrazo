import { Schema, model, Document } from 'mongoose';

export enum ServerStatus {
    ACTIVE = 'active',
    DRAINING = 'draining',
    DOWN = 'down',
}

export interface IOrchestratorServer extends Document {
    server_id: string;
    cores: number;
    max_workers: number;
    active_workers: number;
    status: ServerStatus;
    ipv4?: string;
    ipv6?: string;
    coolify_server_uuid?: string;
    coolify_project_uuid?: string;
    coolify_environment_uuid?: string;
    last_heartbeat: Date;
    created_at: Date;
}

const orchestratorServerSchema = new Schema<IOrchestratorServer>(
    {
        server_id: { type: String, required: true, unique: true },
        cores: { type: Number, required: true },
        max_workers: { type: Number, required: true },
        active_workers: { type: Number, default: 0 },
        status: { type: String, enum: Object.values(ServerStatus), default: ServerStatus.ACTIVE },
        ipv4: { type: String },
        ipv6: { type: String },
        coolify_server_uuid: { type: String },
        coolify_project_uuid: { type: String },
        coolify_environment_uuid: { type: String },
        last_heartbeat: { type: Date, default: Date.now },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: false },
        toJSON: {
            transform: (doc, ret: any) => {
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

export const OrchestratorServer = model<IOrchestratorServer>('OrchestratorServer', orchestratorServerSchema);
