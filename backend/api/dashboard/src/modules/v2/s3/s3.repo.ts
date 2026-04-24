import { S3Bucket, transformWithId, unprefixId } from '@kyrazo/shared';
import { ClientSession } from 'mongoose';
import { CreateS3Dto, UpdateS3Dto } from './s3.types';

export class S3Repo {
    async create(data: Omit<CreateS3Dto, 'transformer'> & { workspaceId: string; namespaceId: string; iv: string; isManagedTransform?: boolean; transformer?: any }, options?: { session?: ClientSession }) {
        const s3Bucket = new S3Bucket({
            ...data,
            workspaceId: unprefixId(data.workspaceId),
            namespaceId: unprefixId(data.namespaceId),
            transformer: data.transformer ? unprefixId(data.transformer as string) : undefined,
        });

        const saved = await s3Bucket.save({ session: options?.session });
        return transformWithId(saved.toJSON(), 's3Bucket') as any;
    }

    async findById(id: string, workspaceId: string, namespaceId: string, includeSecrets = false) {
        const query = S3Bucket.findOne({
            _id: unprefixId(id),
            workspaceId: unprefixId(workspaceId),
            namespaceId: unprefixId(namespaceId),
        });

        if (includeSecrets) {
            query.select('+secretAccessKey +iv');
        }

        const s3Bucket = await query.lean();
        return s3Bucket ? (transformWithId(s3Bucket, 's3Bucket') as any) : null;
    }

    async findByNamespace(workspaceId: string, namespaceId: string) {
        const s3Buckets = await S3Bucket.find({
            workspaceId: unprefixId(workspaceId),
            namespaceId: unprefixId(namespaceId),
        }).lean();

        return transformWithId(s3Buckets, 's3Bucket') as any;
    }

    async update(
        id: string,
        workspaceId: string,
        namespaceId: string,
        data: Omit<UpdateS3Dto, 'transformer'> & { iv?: string; isManagedTransform?: boolean; transformer?: any },
        options?: { session?: ClientSession }
    ) {
        const updated = await S3Bucket.findOneAndUpdate(
            {
                _id: unprefixId(id),
                workspaceId: unprefixId(workspaceId),
                namespaceId: unprefixId(namespaceId),
            },
            {
                ...data,
                transformer: data.transformer ? unprefixId(data.transformer as string) : undefined,
            },
            { new: true, session: options?.session }
        ).lean();

        return updated ? (transformWithId(updated, 's3Bucket') as any) : null;
    }

    async startSession(): Promise<ClientSession> {
        return await S3Bucket.startSession();
    }

    async delete(id: string, workspaceId: string, namespaceId: string) {
        return await S3Bucket.findOneAndDelete({
            _id: unprefixId(id),
            workspaceId: unprefixId(workspaceId),
            namespaceId: unprefixId(namespaceId),
        }).lean();
    }
}

export const s3Repo = new S3Repo();
