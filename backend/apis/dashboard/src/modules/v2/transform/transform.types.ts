import z from 'zod';
import { IPagination, ITransform, ITransformVersion } from '@kyrazo/shared';
import {
    CreateTransformSchema,
    UpdateTransformSchema,
    TestTransformSchema,
    SearchTransformSchema,
    TransformIdParamSchema,
    RollbackParamSchema,
} from './transform.schema';

export type CreateTransformDto = z.infer<typeof CreateTransformSchema>;
export type UpdateTransformDto = z.infer<typeof UpdateTransformSchema>;
export type TestTransformDto = z.infer<typeof TestTransformSchema>;
export type FilterTransformDto = z.infer<typeof SearchTransformSchema>;
export type GetTransformByIdDto = z.infer<typeof TransformIdParamSchema>;
export type RollbackTransformDto = z.infer<typeof RollbackParamSchema>;

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
