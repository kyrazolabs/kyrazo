import { Document, Model, Schema, Types } from 'mongoose';

export interface ISourceAuthentication {
    enabled: boolean;
    type?: 'hmac' | 'service' | 'api_key' | 'basic_auth';
    credentials?: Schema.Types.Mixed;
}

export interface ISource extends Document {
    userId: Types.ObjectId;
    workspaceId: Types.ObjectId;
    projectId: Types.ObjectId;
    name: string;
    description?: string;
    status: 'active' | 'inactive';

    service: 'stripe' | 'paypal' | 'github' | 'shopify' | 'slack' | 'webflow';

    ingressId: string;
    ingressUrl: string;
    forwarding: boolean;
    endpoints: Types.ObjectId[];

    eventTypes?: string[];

    // Authentication
    authentication?: ISourceAuthentication;

    retryPolicy: {
        maxAttempts: number;
    };
}

export interface ISourceModel extends Model<ISource> {
    findByUser(userId: string): Promise<ISource[]>;
    findActive(): Promise<ISource[]>;
}
