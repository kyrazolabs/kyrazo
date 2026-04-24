import z from 'zod';
import { IPagination, ISource } from '@kyrazo/shared';
import {
    CreateSourceSchema,
    UpdateSourceSchema,
    SearchSourceSchema,
    SourceIdParamSchema,
} from './source.schema';

export type CreateSourceDto = z.infer<typeof CreateSourceSchema>;
export type UpdateSourceDto = z.infer<typeof UpdateSourceSchema>;
export type SearchSourceDto = z.infer<typeof SearchSourceSchema>;
export type SourceIdParamDto = z.infer<typeof SourceIdParamSchema>;

export interface CreateSourceResponseV2 {
    success: boolean;
    message: string;
    data: ISource;
}

export interface GetSourcesResponseV2 {
    success: boolean;
    message: string;
    pagination: IPagination;
    data: ISource[];
}

export interface GetSourceByIdResponseV2 {
    success: boolean;
    message: string;
    data: ISource;
}

export interface UpdateSourceResponseV2 {
    success: boolean;
    message: string;
    data: ISource;
}

export interface DeleteSourceResponseV2 {
    success: boolean;
    message: string;
    data: boolean;
}
