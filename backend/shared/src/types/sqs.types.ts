import { Model, Types } from 'mongoose';
import { BaseDocument } from '.';

export interface IASQS extends BaseDocument {
    id: string;
    workspaceId: Types.ObjectId;
    namespaceId: Types.ObjectId;
    name: string;
    queueUrl: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    iv: string;
    transformer?: Types.ObjectId;
    isManagedTransform: boolean;
    queueType: 'standard' | 'fifo';
    useContentBasedDeduplication?: boolean;
    enabled: boolean;
}

export interface IASQSModel extends Model<IASQS> {
    findByWorkspaceAndNamespace(workspaceId: string, namespaceId: string): Promise<IASQS[]>;
}
