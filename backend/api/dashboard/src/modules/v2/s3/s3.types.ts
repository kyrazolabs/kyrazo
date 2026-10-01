import { z } from 'zod';
import { CreateS3Schema, UpdateS3Schema } from './s3.schema';

export type CreateS3Dto = z.infer<typeof CreateS3Schema>;
export type UpdateS3Dto = z.infer<typeof UpdateS3Schema>;

export interface IS3Response {
    id: string;
    name: string;
    provider: string;
    bucketName: string;
    region: string;
    accessKeyId: string;
    endpoint?: string;
    forcePathStyle: boolean;
    transformer?: string;
    isManagedTransform: boolean;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}
