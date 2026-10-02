import { Model, Types } from 'mongoose';
import { BaseDocument } from '.';

export type S3Provider = 'aws' | 'cloudflare' | 'backblaze' | 'minio' | 'custom';
export interface IS3Bucket extends BaseDocument {
    id: string;
    workspaceId: Types.ObjectId;
    namespaceId: Types.ObjectId;
    name: string;
    provider: S3Provider;
    bucketName: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    iv: string;
    endpoint?: string; // Optional for S3-compatible storage like MinIO
    forcePathStyle: boolean;
    transformer?: Types.ObjectId;
    isManagedTransform: boolean;
    enabled: boolean;
}

export interface IS3BucketModel extends Model<IS3Bucket> {
    findByWorkspaceAndNamespace(workspaceId: string, namespaceId: string): Promise<IS3Bucket[]>;
}
