import { Schema, model, Document } from 'mongoose';

export enum WorkerStatus {
    PENDING = 'pending',
    STARTING = 'starting',
    RUNNING = 'running',
    STOPPING = 'stopping',
    STOPPED = 'stopped',
    FAILED = 'failed',
}

export interface IOrchestratorWorker extends Document {
    worker_id: string;
    client_id: string;
    server_id: string;
    status: WorkerStatus;
    created_at: Date;
    updated_at: Date;
}

const orchestratorWorkerSchema = new Schema<IOrchestratorWorker>(
    {
        worker_id: { type: String, required: true, unique: true },
        client_id: { type: String, required: true, index: true },
        server_id: { type: String, required: true, index: true },
        status: { type: String, enum: Object.values(WorkerStatus), default: WorkerStatus.PENDING },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        toJSON: {
            transform: (doc, ret: any) => {
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

export const OrchestratorWorker = model<IOrchestratorWorker>('OrchestratorWorker', orchestratorWorkerSchema);
