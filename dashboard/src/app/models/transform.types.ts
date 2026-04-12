import { Pagination } from './index';

export interface ITransform {
    id: string;
    name: string;
    description?: string;
    code: string;
    currentVersion: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ITransformVersion {
    id: string;
    transformId: string;
    version: number;
    code: string;
    createdBy: string;
    createdAt: string;
}

export interface GetTransformsResponse {
    success: boolean;
    data: ITransform[];
    pagination: Pagination;
}

export interface GetTransformResponse {
    success: boolean;
    data: ITransform;
}

export interface GetVersionsResponse {
    success: boolean;
    data: ITransformVersion[];
}

export interface CreateTransformRequest {
    name: string;
    description?: string;
    code: string;
    isActive?: boolean;
}

export interface UpdateTransformRequest {
    name?: string;
    description?: string;
    code?: string;
    isActive?: boolean;
}

export interface TestTransformRequest {
    code?: string;
    transformId?: string;
    payload: any;
}

export interface TestTransformResponse {
    success: boolean;
    data: {
        result: any;
        logs: string[];
        executionTimeMs: number;
    };
}
