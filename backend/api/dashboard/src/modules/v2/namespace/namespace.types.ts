import z from 'zod';
import { IPagination, INamespace } from '@kyrazo/shared';
import {
    CreateNamespaceSchema,
    UpdateNamespaceSchema,
    SearchNamespaceSchema,
    NamespaceIdParamSchema,
} from './namespace.schema';

export type CreateNamespaceDto = z.infer<typeof CreateNamespaceSchema>;
export type UpdateNamespaceDto = z.infer<typeof UpdateNamespaceSchema>;
export type SearchNamespaceDto = z.infer<typeof SearchNamespaceSchema>;
export type NamespaceIdParamDto = z.infer<typeof NamespaceIdParamSchema>;

export interface CreateNamespaceResponseV2 {
    success: boolean;
    message: string;
    data: INamespace;
}

export interface GetNamespacesResponseV2 {
    success: boolean;
    message: string;
    pagination: IPagination;
    data: INamespace[];
}

export interface GetNamespaceByIdResponseV2 {
    success: boolean;
    message: string;
    data: INamespace;
}

export interface UpdateNamespaceResponseV2 {
    success: boolean;
    message: string;
    data: INamespace;
}

export interface DeleteNamespaceResponseV2 {
    success: boolean;
    message: string;
    data: boolean;
}
