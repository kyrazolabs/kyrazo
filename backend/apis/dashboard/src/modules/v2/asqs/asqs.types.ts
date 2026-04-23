import { z } from 'zod';
import { CreateASQSSchema, UpdateASQSSchema } from './asqs.schema';

export type CreateASQSDto = z.infer<typeof CreateASQSSchema>;
export type UpdateASQSDto = z.infer<typeof UpdateASQSSchema>;

export interface IASQSResponse {
    id: string;
    name: string;
    queueUrl: string;
    queueType: 'standard' | 'fifo';
    useContentBasedDeduplication: boolean;
    region: string;
    accessKeyId: string;
    transformer?: string;
    isManagedTransform: boolean;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}
