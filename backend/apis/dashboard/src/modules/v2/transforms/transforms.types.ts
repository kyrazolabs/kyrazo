import { IPagination, ITransform, ITransformVersion } from '@kyrazo/shared';

export interface CreateTransformResponse {
    success: boolean;
    message: string;
    data: ITransform;
}

export interface GetTransformsResponse {
    success: boolean;
    message: string;
    pagination: IPagination;
    data: ITransform[];
}

export interface GetTransformByIdResponse {
    success: boolean;
    message: string;
    data: ITransform;
}

export interface UpdateTransformResponse {
    success: boolean;
    message: string;
    data: ITransform;
}

export interface DeleteTransformResponse {
    success: boolean;
    message: string;
    data: boolean;
}

export interface GetTransformVersionsResponse {
    success: boolean;
    message: string;
    data: ITransformVersion[];
}

export interface RollbackTransformResponse {
    success: boolean;
    message: string;
    data: ITransform;
}

export interface TestTransformResponse {
    success: boolean;
    message: string;
    data: {
        result: any;
        logs: string[];
        executionTimeMs: number;
    };
}
