import { S3Bucket, transformWithId, unprefixId } from '@kyrazo/shared';
import { CreateS3Dto, UpdateS3Dto } from './s3.types';

export class S3Repo {
    async create(data: CreateS3Dto & { workspaceId: string; namespaceId: string; iv: string }) {
        const s3Bucket = await S3Bucket.create({
            ...data,
            workspaceId: unprefixId(data.workspaceId),
            namespaceId: unprefixId(data.namespaceId),
            transformId: data.transformId ? unprefixId(data.transformId) : undefined,
        });

        return transformWithId(s3Bucket, 's3Bucket') as any;
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
        data: UpdateS3Dto & { iv?: string }
    ) {
        const updated = await S3Bucket.findOneAndUpdate(
            {
                _id: unprefixId(id),
                workspaceId: unprefixId(workspaceId),
                namespaceId: unprefixId(namespaceId),
            },
            {
                ...data,
                transformId: data.transformId ? unprefixId(data.transformId) : undefined,
            },
            { new: true }
        ).lean();

        return updated ? (transformWithId(updated, 's3Bucket') as any) : null;
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
