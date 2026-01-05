import { Document, Model, Types } from 'mongoose';
import { BaseDocument, IPagination } from '.';
export type TargetMethods = 'POST' | 'PUT' | 'PATCH' | 'GET' | 'DELETE';
export type TargetStatus = 'active' | 'inactive';

export interface ITarget<T = string> extends BaseDocument {
    workspaceId: Types.ObjectId;
    projectId: Types.ObjectId;
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
    findByWorkspaceAndProject(
        workspaceId: string,
        projectId: string
    ): Promise<ITarget[]>;
    findActiveByWorkspaceAndProject(
        workspaceId: string,
        projectId: string
    ): Promise<ITarget[]>;
    findActiveByWorkspaceAndProjectAndTargetId(
        workspaceId: string,
        projectId: string,
        targetId: string
    ): Promise<ITarget | null>;
    findActiveByWorkspaceAndProjectAndTargetIds(
        workspaceId: string,
        projectId: string,
        targetIds: string[]
    ): Promise<ITarget[]>;
}
