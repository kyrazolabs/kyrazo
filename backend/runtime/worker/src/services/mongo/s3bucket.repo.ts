import { S3Bucket, unprefixId, type IS3Bucket } from '@kyrazo/shared';

export class S3BucketRepository {
    async getS3BucketById(
        id: string,
        workspaceId: string,
        namespaceId: string
    ): Promise<IS3Bucket | null> {
        return await S3Bucket.findOne({
            _id: unprefixId(id),
            workspaceId: unprefixId(workspaceId),
            namespaceId: unprefixId(namespaceId),
            enabled: true,
        });
    }
}

export const s3BucketRepository = new S3BucketRepository();
