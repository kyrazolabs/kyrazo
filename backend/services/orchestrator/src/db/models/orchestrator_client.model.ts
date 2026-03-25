import { Schema, model, Document } from 'mongoose';

export interface IOrchestratorClient extends Document {
    client_id: string;
    plan_max_workers: number;
    used_workers: number;
    created_at: Date;
}

const orchestratorClientSchema = new Schema<IOrchestratorClient>(
    {
        client_id: { type: String, required: true, unique: true },
        plan_max_workers: { type: Number, required: true },
        used_workers: { type: Number, default: 0 },
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

export const OrchestratorClient = model<IOrchestratorClient>('OrchestratorClient', orchestratorClientSchema);
