import { Model, Types } from 'mongoose';
import { BaseDocument } from '.';

export interface IS3Bucket extends BaseDocument {
    id: string;
    workspaceId: Types.ObjectId;
    namespaceId: Types.ObjectId;
    name: string;
    bucketName: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    iv: string;
    endpoint?: string; // Optional for S3-compatible storage like MinIO
    transformer?: Types.ObjectId;
    isManagedTransform: boolean;
    enabled: boolean;
}

export interface IS3BucketModel extends Model<IS3Bucket> {
    findByWorkspaceAndNamespace(workspaceId: string, namespaceId: string): Promise<IS3Bucket[]>;
}
