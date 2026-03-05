import { Document, Model, Types } from 'mongoose';
import { BaseDocument, IPagination } from '.';
export type TargetMethods = 'POST' | 'PUT' | 'PATCH';
export type TargetStatus = 'active' | 'inactive';

export interface ITarget<T = string> extends BaseDocument {
    id: string;
    workspaceId: Types.ObjectId;
    namespaceId: Types.ObjectId;
    name: string;
    url: string;
    method: TargetMethods;
    description: string;
    enabled: boolean;

    userId: Types.ObjectId;

    secrets?: {
        kid: string;
        value_enc: string;
        iv: string;
        active: boolean;
    }[];

    config: {
        timeout: number;
        retryCount: number;
        rateLimit?: number;
        rateLimitDuration?: number;
    };

    customHeaders?: {
        [key: string]: T;
    };
}

export interface ITargetModel extends Model<ITarget> {
    findByWorkspaceAndNamespace(workspaceId: string, namespaceId: string): Promise<ITarget[]>;
    findActiveByWorkspaceAndNamespace(workspaceId: string, namespaceId: string): Promise<ITarget[]>;
    findActiveByWorkspaceAndNamespaceAndTargetId(
        workspaceId: string,
        namespaceId: string,
        targetId: string
    ): Promise<ITarget | null>;
    findActiveByWorkspaceAndNamespaceAndTargetIds(
        workspaceId: string,
        namespaceId: string,
        targetIds: string[]
    ): Promise<ITarget[]>;
}
