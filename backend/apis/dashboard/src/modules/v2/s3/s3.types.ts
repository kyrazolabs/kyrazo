import { z } from 'zod';
import { CreateS3Schema, UpdateS3Schema } from './s3.schema';

export type CreateS3Dto = z.infer<typeof CreateS3Schema>;
export type UpdateS3Dto = z.infer<typeof UpdateS3Schema>;

export interface IS3Response {
    id: string;
    name: string;
    bucketName: string;
    region: string;
    accessKeyId: string;
    endpoint?: string;
    transformId?: string;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}
