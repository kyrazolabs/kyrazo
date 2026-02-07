import { Document, Model, Types } from 'mongoose';
import { BaseDocument, IPagination } from '.';

export type EndpointStatus = 'active' | 'inactive';
export type EndpointMethods = 'POST' | 'PUT' | 'PATCH';

export interface IEndpoint<T = string> extends BaseDocument {
    id: string;
    workspaceId: Types.ObjectId;
    projectId: Types.ObjectId;
    name: string;
    status: EndpointStatus;
    url: string;
    method: EndpointMethods;
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

export interface IEndpointModel extends Model<IEndpoint> {
    findByWorkspaceAndProject(workspaceId: string, projectId: string): Promise<IEndpoint[]>;
    findActiveByWorkspaceAndProject(workspaceId: string, projectId: string): Promise<IEndpoint[]>;
    findActiveByWorkspaceAndProjectAndId(
        workspaceId: string,
        projectId: string,
        endpointId: string
    ): Promise<IEndpoint | null>;
    findActiveByWorkspaceAndProjectAndIds(
        workspaceId: string,
        projectId: string,
        endpointIds: string[]
    ): Promise<IEndpoint[]>;
}

export interface CreateEndpointResponse {
    success: true;
    message?: string;
    data?: {
        endpoint: IEndpoint;
    };
}

export interface GetEndpointResponse {
    success: true;
    message?: string;
    data?: IEndpoint;
}

export interface GetEndpointsResponse {
    success: true;
    message?: string;
    pagination: IPagination;
    data?: Array<IEndpoint>;
}

export interface UpdateEndpointResponse {
    success: true;
    message?: string;
    data?: IEndpoint;
}

export interface DeleteEndpointResponse {
    success: true;
    message?: string;
}
