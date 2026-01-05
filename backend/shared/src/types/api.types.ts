import { Types, Document, Model } from 'mongoose';

export interface IAPIKey extends Document {
    kid: string;
    key: string;
    name: string;
    workspace: Types.ObjectId;
    createBy: Types.ObjectId;
    scopes: Array<
        | 'dispatch:event'
        | 'dispatch:event:batch'
        | 'dispatch:target:create'
        | 'dispatch:target:read'
        | 'dispatch:target:update'
        | 'dispatch:target:delete'
        | 'dispatch:target:signing:rotate'
        | 'ingest:source:create'
        | 'ingest:source:read'
        | 'ingest:source:update'
        | 'ingest:source:delete'
        | 'ingest:endpoint:create'
        | 'ingest:endpoint:read'
        | 'ingest:endpoint:update'
        | 'ingest:endpoint:delete'
    >;
    lastFour: string;
    isEnabled: boolean;
    expiresAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;

    // Instance methods
}

export interface IAPIKeyModel extends Model<IAPIKey> {
    updateLastUsed(keyId: string): Promise<IAPIKey>;
}

export type ApiKeyAuthEnv = {
    Variables: {
        key?: {
            name: string;
            permissions: string[];
        };
    };
};

export type Env = {
    Variables: {
        userId: Types.ObjectId; // من authenticate middleware
        apiKey?: IAPIKey; // من apiKeyAuth middleware
    };
};
