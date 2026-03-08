import { Types } from 'mongoose';

// Export all authentication types
export * from './auth.types';
export * from './source.types';
export * from './delivery.types';
export * from './api.types';
export * from './endpoint.types';
export * from './event.types';
export * from './namespace.types';
export * from './user.types';
export * from './billing.types';
export * from './workspace.types';
export * from './target.types';
export * from './ingest.types';

export interface IPagination {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export interface IErrorResponse {
    success: false;
    error?: {
        code: string;
        message: string;
        details?: unknown;
        requestId: string;
    };
}

// Re-export common types that might be used across the application
export interface BaseDocument extends Document {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// User roles in workspaces
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';
export type PermissionType = 'read' | 'edit';
