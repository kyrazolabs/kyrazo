import { Types, Model } from 'mongoose';
import { BaseDocument } from '.';

export interface ITransform extends BaseDocument {
    id: string;
    workspaceId: Types.ObjectId;
    namespaceId: Types.ObjectId;
    name: string;
    description?: string;
    code: string;
    currentVersion: number;
    isActive: boolean;
}

export interface ITransformVersion extends BaseDocument {
    id: string;
    transformId: Types.ObjectId;
    version: number;
    code: string;
    createdBy: Types.ObjectId;
}

export interface ITransformModel extends Model<ITransform> {
    findByWorkspace(workspaceId: string): Promise<ITransform[]>;
    findByNamespace(namespaceId: string): Promise<ITransform[]>;
    findActive(workspaceId: string, namespaceId: string): Promise<ITransform[]>;
}

export interface ITransformVersionModel extends Model<ITransformVersion> {
    findByTransform(transformId: string): Promise<ITransformVersion[]>;
    findByVersion(transformId: string, version: number): Promise<ITransformVersion | null>;
}
